'use strict';
const scoring = require('../../../../common/models/scoring')
const expect = require('expect.js');

describe('scoring', () => {
  describe('matchingScoring()', () => {
    function comparableResults(results) {
      return results.map(({id, scoring}) => ({id, scoring}))
    }

    it('scores the closest', () => {
      // Given

      const needer = {
        id: 'neederId',
        nombre_hebergement: 1,
        approvisionnement: false,
        conseils: false,
        autres: false,
      }

      const foundHelpers = [
        {
          id: 'helper_1',
          nombre_hebergement: 2,
          approvisionnement: true,
          conseils: true,
          autres: true,
        },
        {
          id: 'helper_2',
          nombre_hebergement: 2,
          approvisionnement: true,
          conseils: true,
          autres: true,
        },
        {
          id: 'helper_3',
          nombre_hebergement: 2,
          approvisionnement: true,
          conseils: true,
          autres: true,
        }
      ]
      const idsAndDistances = [
        {id: 'helper_1', distanceinmeters: 0},
        {id: 'helper_2', distanceinmeters: 7000},
        {id: 'helper_3', distanceinmeters: 2000},
      ]

      // When
      const results = scoring.matchingScoring(needer, foundHelpers, idsAndDistances)

      // Then
      expect(comparableResults(results)).to.eql(
        [
          {
            id: 'helper_1',
            scoring: 2
          },
          {
            id: 'helper_3',
            scoring: 1.67
          },
          {
            id: 'helper_2',
            scoring: 1.33
          }
        ]
      )

    });
    it('scores the number of matching criteria', () => {
      // Given

      const needer = {
        id: 'neederId',
        nombre_hebergement: 6,
        approvisionnement: true,
        conseils: true,
        autres: true,
      }

      const foundHelpers = [
        {
          id: 'helper_without_match',
          nombre_hebergement: 2,
          approvisionnement: false,
          conseils: false,
          autres: false,
        },
        {
          id: 'helper_with_3_matches',
          nombre_hebergement: 2,
          approvisionnement: true,
          conseils: true,
          autres: true,
        },
        {
          id: 'helper_with_2_matches',
          nombre_hebergement: 2,
          approvisionnement: false,
          conseils: true,
          autres: true,
        },
        {
          id: 'helper_with_4_matches',
          nombre_hebergement: 6,
          approvisionnement: true,
          conseils: true,
          autres: true,
        }
      ]
      const idsAndDistances = [
        {id: 'helper_without_match', distanceinmeters: 0},
        {id: 'helper_with_3_matches', distanceinmeters: 0},
        {id: 'helper_with_2_matches', distanceinmeters: 0},
        {id: 'helper_with_4_matches', distanceinmeters: 0},
      ]

      // When
      const results = scoring.matchingScoring(needer, foundHelpers, idsAndDistances)

      // Then
      expect(comparableResults(results)).to.eql(
        [
          {
            id: 'helper_with_4_matches',
            scoring: 4.5
          },
          {
            id: 'helper_with_3_matches',
            scoring: 4
          },
          {
            id: 'helper_with_2_matches',
            scoring: 2.75
          },
          {
            id: 'helper_without_match',
            scoring: 1
          }
        ]
      )

    });
    it('scores the closest when same number of criteria matched', () => {
      // Given

      const needer = {
        id: 'neederId',
        nombre_hebergement: 6,
        approvisionnement: true,
        conseils: true,
        autres: true,
      }

      const foundHelpers = [
        {
          id: 'closest_helper_with_one_match',
          nombre_hebergement: 6,
          approvisionnement: false,
          conseils: false,
          autres: false,
        },
        {
          id: 'helper_with_3_matches',
          nombre_hebergement: 2,
          approvisionnement: true,
          conseils: true,
          autres: true,
        },
        {
          id: 'helper_with_3_matches_closest',
          nombre_hebergement: 2,
          approvisionnement: true,
          conseils: true,
          autres: true,
        },
      ]
      const idsAndDistances = [
        {id: 'closest_helper_with_one_match', distanceinmeters: 0},
        {id: 'helper_with_3_matches', distanceinmeters: 9000},
        {id: 'helper_with_3_matches_closest', distanceinmeters: 1000},
      ]

      // When
      const results = scoring.matchingScoring(needer, foundHelpers, idsAndDistances)

      // Then
      expect(comparableResults(results)).to.eql(
        [
          {
            id: 'helper_with_3_matches_closest',
            scoring: 3.67
          },
          {
            id: 'helper_with_3_matches',
            scoring: 3.33
          },
          {
            id: 'closest_helper_with_one_match',
            scoring: 2
          },
        ]
      )

    });
    it('scores the best match even if it is not the closest', () => {
      // Given

      const needer = {
        id: 'neederId',
        nombre_hebergement: 6,
        approvisionnement: true,
        conseils: true,
        autres: true,
      }

      const foundHelpers = [
        {
          id: 'closest_helper_with_2_matches',
          nombre_hebergement: 6,
          approvisionnement: true,
          conseils: false,
          autres: false,
        },
        {
          id: 'helper_with_3_matches',
          nombre_hebergement: 2,
          approvisionnement: true,
          conseils: true,
          autres: true,
        },
      ]
      const idsAndDistances = [
        {id: 'closest_helper_with_2_matches', distanceinmeters: 0},
        {id: 'helper_with_3_matches', distanceinmeters: 9000},
      ]

      // When
      const results = scoring.matchingScoring(needer, foundHelpers, idsAndDistances)

      // Then
      expect(comparableResults(results)).to.eql(
        [
          {
            id: 'helper_with_3_matches',
            scoring: 3.5
          },
          {
            id: 'closest_helper_with_2_matches',
            scoring: 3
          },
        ]
      )

    });
    it('scores the same when same criteria matching & same distances', () => {
      // Given

      const needer = {
        id: 'neederId',
        nombre_hebergement: 6,
        approvisionnement: true,
        conseils: true,
        autres: true,
      }

      const foundHelpers = [
        {
          id: 'helper_1',
          nombre_hebergement: 6,
          approvisionnement: true,
          conseils: true,
          autres: true,
        },
        {
          id: 'helper_2',
          nombre_hebergement: 6,
          approvisionnement: true,
          conseils: true,
          autres: true,
        },
      ]
      const idsAndDistances = [
        {id: 'helper_1', distanceinmeters: 4000},
        {id: 'helper_2', distanceinmeters: 4000},
      ]

      // When
      const results = scoring.matchingScoring(needer, foundHelpers, idsAndDistances)

      // Then
      expect(comparableResults(results)).to.eql(
        [
          {
            id: 'helper_1',
            scoring: 5
          },
          {
            id: 'helper_2',
            scoring: 5
          },
        ]
      )

    });
  });
});
