export interface TaskDefinition {
    present: boolean;

export enum TaskTimeoutPolicyEnum {
    retry = 'RETRY',
    timeOutWF = 'TIME_OUT_WF',
    alertOnly = 'ALERT_ONLY',
}

export enum TaskRetryLogicEnum {
    fixed = 'FIXED',
    exponentialBackoff = 'EXPONENTIAL_BACKOFF',
}

export interface TaskDefinition {
    createTime?: number,
    name: string,
    description?: string,
    retryCount?: number,
    timeoutSeconds?: number,
    inputKeys?: string[],
    outputKeys?: string[],
    inputTemplate?: any,
    timeoutPolicy?: TaskTimeoutPolicyEnum,
    retryLogic?: TaskRetryLogicEnum,
    retryDelaySeconds?: number,
    responseTimeoutSeconds?: number,
    rateLimitPerFrequency?: number,
    rateLimitFrequencyInSeconds?: number
    concurrentExecLimit?: number,
}

export interface WorkflowTask {
    name: string,
    taskReferenceName: string,
    inputParameters?: any,
    type: string, // ex: SIMPLE,
    startDelay: number,
    optional: boolean,
    taskDefinition: TaskDefinition,
    asyncComplete: boolean,
}

export interface PollTask {
    taskType: string;
    status: TaskState;
    inputData?: any;
    referenceTaskName: string;
    retryCount: number,
    seq: number,
    correlationId: string,
    pollCount: number,
    taskDefName: string,
    scheduledTime: number,
    startTime: number,
    endTime: number,
    updateTime: number,
    startDelayInSeconds: number,
    retried: boolean,
    executed: boolean,
    callbackFromWorker: boolean,
    responseTimeoutSeconds: number,
    workflowInstanceId: string,
    workflowType: string,
    taskId: string,
    callbackAfterSeconds: number,
    workerId: string,
    workflowTask: WorkflowTask,
    rateLimitPerFrequency: number,
    rateLimitFrequencyInSeconds: number,
    workflowPriority: number,
    taskDefinition: TaskDefinition,
    queueWaitTime: number,
    taskStatus: TaskState,
}

export enum TaskState {
    scheduled= 'SCHEDULED',
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
