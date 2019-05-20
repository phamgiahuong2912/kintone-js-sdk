/**
 * kintone api - nodejs client
 * test record module
 */

const nock = require('nock');
const {API_ROUTE, URI} = require('../../../utils/constant');
const common = require('../../../utils/common');

const {Connection, Auth, Record} = require(common.MAIN_PATH_BASE);
const auth = new Auth();
auth.setPasswordAuth(common.USERNAME, common.PASSWORD);
const conn = new Connection(common.DOMAIN, auth);
const recordModule = new Record(conn);

const appID = 84;
describe('upsertRecords function', () => {
  describe('success case', () => {
    // eslint-disable-next-line max-statements
    it('should execute correctly insert & update', () => {
      const expectBodys = {'requests': []};
      const expectResults = {'results': []};
      const recordsDataLenght = 200;
      const recordsWithUpd8Key = [];
      const recordsForPut = [];
      const recordsForPost = [];
      const resultsForPut = [];
      const resultsForPost = {ids: [], revisions: []};
      for (let index = 0; index < recordsDataLenght; index++) {
        const recordForPut = {
          updateKey: {
            field: 'Text_0',
            value: 'update' + index
          },
          record: {
            Text_1: {
              value: index
            }
          }
        };
        const recordForPost = {
          updateKey: {
            field: 'Text_0',
            value: 'add' + index
          },
          record: {
            Text_1: {
              value: index
            }
          }
        };
        recordsForPut.push(recordForPut);
        recordsForPost.push({
          record: {
            Text_0: {
              value: 'add' + index
            },
            Text_1: {
              value: index
            }
          }
        });
        resultsForPut.push({
          id: 1 + index,
          revision: index > 100 ? 3 : 2,
        });
        resultsForPost.ids.push(recordsDataLenght + index);
        resultsForPost.revisions.push(1);
        recordsWithUpd8Key.push(recordForPut);
        recordsWithUpd8Key.push(recordForPost);
      }
      for (let index = 0; index < Math.ceil(recordsDataLenght / API_ROUTE.UPDATE_RECORDS_LIMIT); index++) {
        const start = index * API_ROUTE.UPDATE_RECORDS_LIMIT;
        const end = start + API_ROUTE.UPDATE_RECORDS_LIMIT;
        expectBodys.requests.push({
          'api': API_ROUTE.RECORDS,
          'method': 'PUT',
          'payload': {
            'app': appID,
            'records': recordsForPut.slice(start, end)
          }
        });
        expectResults.results.push({
          'records': resultsForPut.slice(start, end)
        });
      }

      for (let index = 0; index < Math.ceil(recordsDataLenght / API_ROUTE.UPDATE_RECORDS_LIMIT); index++) {
        const start = index * API_ROUTE.UPDATE_RECORDS_LIMIT;
        const end = start + API_ROUTE.UPDATE_RECORDS_LIMIT;
        expectBodys.requests.push({
          'api': API_ROUTE.RECORDS,
          'method': 'POST',
          'payload': {
            'app': appID,
            'records': recordsForPost.slice(start, end)
          }
        });
        expectResults.results.push({
          'ids': resultsForPost.ids.slice(start, end),
          'revisions': resultsForPost.revisions.slice(start, end)
        });
      }
      const recordsForGet = [];
      for (let index = 0; index < 500; index++) {
        const record = {
          record_id: {
            type: 'RECORD_NUMBER',
            value: index + 1
          },
          Text_0: {
            type: 'String',
            value: 'update' + index
          },
          Text_1: {
            type: 'String',
            value: index
          }
        };
        recordsForGet.push(record);
      }
      const body = {
        app: appID,
        totalCount: false,
      };

      const expectResponsePerRequest = [{'records': recordsForGet}];

      let expectURL1 = `${API_ROUTE.RECORDS}?app=${body.app}`;
      expectURL1 += `&query=${encodeURIComponent(`limit ${API_ROUTE.GET_RECORDS_LIMIT} offset 0`)}`;
      expectURL1 += `&totalCount=${body.totalCount}`;

      let expectURL2 = `${API_ROUTE.BULK_REQUEST}?app=${body.app}`;
      expectURL2 += `&query=${encodeURIComponent(`limit ${API_ROUTE.GET_RECORDS_LIMIT} offset 0`)}`;
      expectURL2 += `&totalCount=${body.totalCount}`;
      nock(URI)
        .get(expectURL1)
        .matchHeader(common.PASSWORD_AUTH, (authHeader) => {
          expect(authHeader).toBe(Buffer.from(common.USERNAME + ':' + common.PASSWORD).toString('base64'));
          return true;
        })
        .reply(200, expectResponsePerRequest[0])

      nock(URI)
        .post(expectURL2, (rqBody) => {
          expect(rqBody).toEqual(expectBodys);
          return true;
        })
        .matchHeader(common.PASSWORD_AUTH, (authHeader) => {
          expect(authHeader).toBe(Buffer.from(common.USERNAME + ':' + common.PASSWORD).toString('base64'));
          return true;
        })
        .matchHeader('Content-Type', (type) => {
          expect(type).toEqual(expect.stringContaining('application/json'));
          return true;
        })
        .reply(200, expectResults);
      const upsertRecordsResult = recordModule.upsertRecords(appID, recordsWithUpd8Key).then((resp) => {
        expect(upsertRecordsResult).toHaveProperty('then');
        expect(upsertRecordsResult).toHaveProperty('catch');
        expect(resp).toEqual(expectResults);
      });
    });
  });
});
