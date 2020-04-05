'use strict';
const scoring = require('../../../../common/models/scoring')
const expect = require('expect.js');

describe('scoring', () => {
  describe('matchingScoring()', () => {
    function comparableResults(results) {
      return results.map(({id, criteresMatching}) => ({id, criteresMatching}))
    }

    it('sorts by distance', () => {
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
            criteresMatching: {score: 1, total: 1}
          },
          {
            id: 'helper_3',
            criteresMatching: {score: 1, total: 1}
          },
          {
            id: 'helper_2',
            criteresMatching: {score: 1, total: 1}
          }
        ]
      )

    });
  });
});
