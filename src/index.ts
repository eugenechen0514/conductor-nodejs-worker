import {EventEmitter} from 'events';
import pForever from 'p-forever';
import sleep from 'sleep-promise';

import axios, {AxiosInstance} from 'axios';
import {PollTask, TaskState} from "./lib/netflix-conductor";

export type WorkFunction<Result = void> = (input: any) => Promise<Result>;



export default class ConductorWorker extends EventEmitter {
  url: string;
  apiPath: string;
  workerid: string;
  client: AxiosInstance;
  working: boolean = false;

  constructor(options: {url: string, apiPath: string, workerid: string}) {
    super();
    this.url = options.url;
    this.apiPath = options.apiPath;
    this.workerid = options.workerid;

    this.client = axios.create({baseURL: this.url});
  }

  pollAndWork(taskType: string, fn: WorkFunction) { // keep 'function'
    return (async () => {
      // Poll for Worker task
      const pullTask: PollTask = await this.client.get(`${this.apiPath}/tasks/poll/${taskType}?workerid=${this.workerid}`);
      if (!pullTask || !pullTask.inputData) {
        return;
      }
      const input = pullTask.inputData.input;
      const { workflowInstanceId, taskId } = pullTask

      // Ack the Task
      const obj: boolean = await this.client.post(`${this.apiPath}/tasks/${taskId}/ack?workerid=${this.workerid}`);
      if (obj !== true) {
        return;
      }

      const t1 = Date.now();
      const baseTaskInfo = {
        workflowInstanceId,
        taskId,
      };

      // Working
      return fn(input)
          .then(output => {
            const updateTaskInfo = {
              ...baseTaskInfo,
              callbackAfterSeconds: (Date.now() - t1)/1000,
              outputData: output,
              status: TaskState.completed,
            };
            return updateTaskInfo;
          })
          .catch((err) => {
            const updateTaskInfo = {
              ...baseTaskInfo,
              callbackAfterSeconds: (Date.now() - t1)/1000,
              reasonForIncompletion: err, // If failed, reason for failure
              status: TaskState.failed,
            };
            return updateTaskInfo;
          })
          .then(updateTaskInfo => {
            // Return response, add logs
            return this.client.post(`${this.apiPath}/tasks/`, updateTaskInfo)
                .then(result => {
                  console.log(result);
                })
                .catch(err => {
                  console.error(err); // resolve
                });
          })

    })();
  }
  start(taskType: string, fn: WorkFunction, interval: number) {
    this.working = true
    pForever(async () => {
      if (this.working) {
        await sleep(interval || 1000)
        return this.pollAndWork(taskType, fn).then(data => {
          console.log(true)
        }, (err) => {
          console.log(err)
        })
      } else {
        return pForever.end
      }
    })
  }

  stop(taskType: string, fn: WorkFunction) {
    this.working = false
  }
}
