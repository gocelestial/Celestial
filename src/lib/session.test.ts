import { resetEphemeralSessionData } from './session';

const session = {
    foo: 'bar',
    hello: 'world'
};

describe('resetEphemeralSessionData', () => {
    let request;

    beforeEach(() => {
        request = { session }
    });

    test('should clear top level keys from request', () => {
        resetEphemeralSessionData(request, ['foo', 'hello']);
        expect(request.session).toEqual({});
    });

    test('should leave request untouched without keys', () => {
        resetEphemeralSessionData(request, []);
        expect(request.session).toEqual(session);
    });
});
