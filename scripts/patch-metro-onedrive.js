/**
 * OneDrive on Windows marks files as reparse points. Metro then treats them
 * as symlinks, readlink() throws EINVAL, and modules like expo-router/entry
 * disappear from the file map.
 *
 * Re-applied on postinstall and from metro.config.js.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'node_modules');

function patchOnce(filePath, marker, needle, insert) {
  if (!fs.existsSync(filePath)) return;
  const source = fs.readFileSync(filePath, 'utf8');
  if (source.includes(marker)) return;
  if (!source.includes(needle)) return;
  fs.writeFileSync(filePath, source.replace(needle, insert));
}

patchOnce(
  path.join(root, '@expo', 'metro-file-map', 'build', 'index.js'),
  'OneDrive/Windows reparse points',
  `            else {
                // Anything else is fatal.
                throw error;
            }`,
  `            else if (['EINVAL', 'UNKNOWN', 'ENOTSUP'].includes(error.code ?? '')) {
                // OneDrive/Windows reparse points look like symlinks; readlink() fails.
                // Keep the file in the map as a regular file so the transformer can start.
                const fileData = delta.changedFiles.get(normalFilePath);
                if (fileData) {
                    fileData[constants_1.default.SYMLINK] = 0;
                }
            }
            else {
                // Anything else is fatal.
                throw error;
            }`,
);

const crawlerPath = path.join(root, '@expo', 'metro-file-map', 'build', 'crawlers', 'node', 'index.js');
patchOnce(
  crawlerPath,
  'treatAsSymlink',
  `                    const file = directory + path.sep + name;
                    const isSymbolicLink = entry.isSymbolicLink();
                    if (ignore(file) || (!includeSymlinks && isSymbolicLink)) {
                        continue;
                    }`,
  `                    const file = directory + path.sep + name;
                    const isSymbolicLink = entry.isSymbolicLink();
                    let treatAsSymlink = isSymbolicLink;
                    if (isSymbolicLink) {
                        try {
                            fs.readlinkSync(file);
                        }
                        catch (symlinkErr) {
                            if (symlinkErr && (symlinkErr.code === 'EINVAL' || symlinkErr.code === 'UNKNOWN' || symlinkErr.code === 'ENOTSUP')) {
                                treatAsSymlink = false;
                            }
                        }
                    }
                    if (ignore(file) || (!includeSymlinks && treatAsSymlink)) {
                        continue;
                    }`,
);
patchOnce(
  crawlerPath,
  'treatAsSymlink && !exts[ext]',
  `                    if (!isSymbolicLink && !exts[ext]) {
                        continue;
                    }`,
  `                    if (!treatAsSymlink && !exts[ext]) {
                        continue;
                    }`,
);
patchOnce(
  crawlerPath,
  'treatAsSymlink ? 1 : 0',
  `                        result.set(childNormal, [null, 0, 0, null, isSymbolicLink ? 1 : 0, null]);`,
  `                        result.set(childNormal, [null, 0, 0, null, treatAsSymlink ? 1 : 0, null]);`,
);

const treeFsPath = path.join(root, '@expo', 'metro-file-map', 'build', 'lib', 'TreeFS.js');
patchOnce(
  treeFsPath,
  "error.code === 'EINVAL'",
  `            catch {
                return undefined;
            }`,
  `            catch (error) {
                if (error && (error.code === 'EINVAL' || error.code === 'UNKNOWN' || error.code === 'ENOTSUP')) {
                    symlinkNode[constants_1.default.SYMLINK] = 0;
                    return canonicalPathOfSymlink;
                }
                return undefined;
            }`,
);
patchOnce(
  treeFsPath,
  'Failed to make parent directory entry',
  `        if (!parentDirNode.exists) {
            throw new Error(\`TreeFS: Failed to make parent directory entry for \${mixedPath}\`);
        }`,
  `        if (!parentDirNode.exists) {
            return;
        }`,
);

patchOnce(
  path.join(root, '@expo', 'metro-file-map', 'build', 'crawlers', 'node', 'fallback.js'),
  "error.code === 'EINVAL'",
  `                catch {
                    return null;
                }`,
  `                catch (error) {
                    if (error && (error.code === 'EINVAL' || error.code === 'UNKNOWN' || error.code === 'ENOTSUP')) {
                        const ext = path_1.default.extname(absolutePath).slice(1);
                        if (!exts[ext]) {
                            return null;
                        }
                        return [stat.mtime.getTime(), stat.size, 0, null, 0, null];
                    }
                    return null;
                }`,
);

const doesFileExistNeedle = `  doesFileExist = (filePath) => {
    return this._fileSystem.exists(filePath);
  };`;
const doesFileExistInsert = `  doesFileExist = (filePath) => {
    if (!this._fileSystem) {
      try {
        return _fs.default.existsSync(filePath);
      } catch {
        return false;
      }
    }
    return this._fileSystem.exists(filePath);
  };`;

for (const depGraphPath of [
  path.join(root, '@expo', 'metro', 'node_modules', 'metro', 'src', 'node-haste', 'DependencyGraph.js'),
  path.join(root, 'metro', 'src', 'node-haste', 'DependencyGraph.js'),
]) {
  patchOnce(depGraphPath, 'if (!this._fileSystem)', doesFileExistNeedle, doesFileExistInsert);
}
