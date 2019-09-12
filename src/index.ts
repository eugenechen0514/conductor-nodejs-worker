import {EventEmitter} from 'events';
import clients from 'restify-clients';
import pForever from 'p-forever';
import sleep from 'sleep-promise';

export type WorkFunction<Result = void> = (input: any) => Promise<Result>;

export default class ConductorWorker extends EventEmitter {
  url: string;
  apiPath: string;
  workerid: string;
  client: string;
  working: boolean = false;

  constructor(options: {url: string, apiPath: string, workerid: string}) {
    super();
    this.url = options.url;
    this.apiPath = options.apiPath;
    this.workerid = options.workerid;
    this.client = clients.createJsonClient({
      url: this.url,
    })
  }

  pollAndWork(taskType: string, fn: WorkFunction) { // keep 'function'
    return new Promise((resolve, reject) => {
      this.client.get(`${this.apiPath}/tasks/poll/${taskType}?workerid=${this.workerid}`, (err, req, res, obj) => {
        if (err){
          reject(err);
          return
        }
        if (!obj || !obj.inputData) {
          resolve();
          return
        }
        const input = obj.inputData.input
        const { workflowInstanceId, taskId } = obj
        this.client.post(`${this.apiPath}/tasks/${taskId}/ack?workerid=${this.workerid}`, (err, req, res, obj) => {
          if (err){
            reject(err);
            return
          }
          // console.log('ack?: %j', obj)
          if (obj !== true) {
            resolve()
            return
          }
          const t1 = Date.now();
          const result = {
            workflowInstanceId,
            taskId,
          }
          fn(input).then(output => {
            result.callbackAfterSeconds = (Date.now() - t1)/1000
            result.outputData = output
            result.status ='COMPLETED'
            this.client.post(`${this.apiPath}/tasks/`, result, (err, req, res, obj) => {
              // err is RestError: Invalid JSON in response, ignore it
              // console.log(obj)
              resolve()
            })
          }, (err) => {
            result.callbackAfterSeconds = (Date.now() - t1)/1000
            result.reasonForIncompletion = err // If failed, reason for failure
            result.status ='FAILED'
            this.client.post(`${this.apiPath}/tasks/`, result, (err, req, res, obj) => {
              // err is RestError: Invalid JSON in response, ignore it
              // console.log(obj)
              resolve()
            })
          })
        })
      })
    })
  }
  Start(taskType: string, fn: WorkFunction, interval: number) {
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

  Stop(taskType: string, fn: WorkFunction) {
    this.working = false
  }
}
