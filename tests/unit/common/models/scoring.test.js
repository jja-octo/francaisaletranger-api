'use strict';
const scoring = require('../../../../common/models/scoring')
const expect = require('expect.js');

function comparableResults(results) {
  return results.map((r) => {
    return {
      id: r.id,
      distanceInMeters: Math.round(r.distanceInMeters),
      criteresMatching: r.criteresMatching
    }
  })
}
describe('scoring', () => {
  describe('matchingScoring()', () => {
    it('___', () => {
      // Given

      const needer = {
        id: 'neederId',
        gps_coordinates: {
          lng: 2.9,
          lat: 50
        },
        nombre_hebergement: 2,
        approvisionnement: true,
        conseils: true,
        autres: false,
      }

      const foundHelpers = [{
        id: 'helper_1',
        nom: 'Smith',
        prenom: 'John',
        nombre_hebergement: 2,
        approvisionnement: true,
        conseils: true,
        autres: false,
        gps_coordinates: {
          lng: 2.9,
          lat: 50
        }
      },
      {
        id: 'helper_2',
        nom: 'Smith',
        prenom: 'Julie',
        nombre_hebergement: 2,
        approvisionnement: false,
        conseils: false,
        autres: true,
        gps_coordinates: {
          lng: 2.9,
          lat: 50
        }
      },
      {
        id: 'helper_3',
        nom: 'Smith',
        prenom: 'John',
        nombre_hebergement: 2,
        approvisionnement: true,
        conseils: true,
        autres: false,
        gps_coordinates: {
          lng: 3,
          lat: 50
        }
      }]

      // When
      const results = scoring.matchingScoring(needer, foundHelpers)

        // Then
        expect(comparableResults(results)).to.eql(
          [
            {
              id: 'helper_1',
              distanceInMeters: 0,
              criteresMatching: { score: 3, total: 3 }
            },
            {
              id: 'helper_2',
              distanceInMeters: 0,
              criteresMatching: { score: 1, total: 3 }
            },
            {
              id: 'helper_3',
              distanceInMeters: 7147,
              criteresMatching: { score: 3, total: 3 }
            }
          ]
        )
        
    });
  });
});
