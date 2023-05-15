/* @flow strict-local */
import type { ApiResponse, Auth } from './transportTypes';
import { apiPost } from './apiFetch';

export default async (auth: Auth, id: number, name: string): Promise<ApiResponse> =>
    apiPost(auth, `messages/${id}`, {
        message_id: id,
        topic: name,
        propagate_mode: 'change_later',
        send_notification_to_old_thread: false,
        send_notification_to_new_thread: false,
        method: 'PATCH',
    });
