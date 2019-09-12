export interface PollTask {
    inputData?: {
        input: any;
    };
    workflowInstanceId: string;
    taskId: string;
}

export enum TaskState {
    scheduled= 'scheduled',
    inProgress = 'IN_PROGRESS',
    failed = 'FAILED',
    completed = 'COMPLETED',
    cancelled = 'CANCELLED',
}

export interface UpdatingTaskResult {
    workflowInstanceId: string;
    taskId: string;
    reasonForIncompletion?: string;
    callbackAfterSeconds?: number,
    status?: TaskState.inProgress | TaskState.completed | TaskState.failed,
    outputData?: any;
}
