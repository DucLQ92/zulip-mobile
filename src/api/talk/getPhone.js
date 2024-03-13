/* @flow strict-local */
import userAgent from '../../utils/userAgent';

export default (realm: URL, email: string, token: string): Promise<Response> =>
    fetch(new URL(`/contact/${email}?token=${token}`,  realm.toString().indexOf('dev-talk') > -1 ? 'https://dev-talk-ext.nextpay.vn' : 'https://talk-ext.nextpay.vn').toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
            'User-Agent': userAgent,
        },
        method: 'get',
    });
