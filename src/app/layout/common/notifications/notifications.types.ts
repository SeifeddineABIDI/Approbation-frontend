export interface Notification
{
    id: string;
    userId: string;
    icon?: string;
    image?: string;
    title?: string;
    description?: string;
    time: string;
    link?: string;
    useRouter?: boolean;
    isRead: boolean;
}
