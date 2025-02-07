export interface Tag
{
    id?: string;
    title?: string;
}

export interface Task
{
    taskId: string;
    taskName: string;
    processInstanceId: string;
    assignee: string;
    requester: string;
    startDate: string;
    endDate:string;
    createDate:string;
    requesterFullName?:string;
}
