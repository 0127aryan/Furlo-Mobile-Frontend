import { useEffect, useState } from 'react';

import {
  getPetSpecies,
  getPostVerb,
  getPostVerbPlural,
  loadSpeciesVerbsFromDB,
  type SpeciesSource,
} from '@/lib/petVerbMap';

export function usePostVerb(pet: SpeciesSource) {
  const [verbsReady, setVerbsReady] = useState(false);

  useEffect(() => {
    loadSpeciesVerbsFromDB().finally(() => setVerbsReady(true));
  }, []);

  const species = getPetSpecies(pet);
  const verb = getPostVerb(species);
  const verbPlural = getPostVerbPlural(species, 2);

  return {
    verbsReady,
    species,
    verb,
    verbPlural,
    verbLower: verb.toLowerCase(),
    verbPluralLower: verbPlural.toLowerCase(),
  };
}
