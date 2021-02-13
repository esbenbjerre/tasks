import React, { Component } from "react"
import { UserProfile, Task, Identifiable, ToastType } from "./Models"
import AddTask from "./AddTask"
import { CheckIcon, TrashIcon, XIcon } from "@primer/octicons-react"
import { API_URL } from "./Constants"

type Props = {
  profile: UserProfile | null
  users: Array<Identifiable>
  groups: Array<Identifiable>
  withApiKey: (f: (apiKey: string) => void) => void
  getWithApiKey: (endpoint: string, f: (data: any) => void) => void
  showToast: (type: ToastType, message: string) => void
}

type State = {
  tasks: Array<Task>
}

export default class Tasks extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      tasks: []
    }
    this.updateTasks = this.updateTasks.bind(this)
  }

  componentDidMount() {
    this.updateTasks()
  }

  updateTasks(): void {
    this.props.getWithApiKey("tasks", data => this.setState({tasks: data as Array<Task>}))
  }

  modifyTask(id: number, action: string) {
    this.props.withApiKey(apiKey => {
      fetch(`${API_URL}/tasks/${action}/${id}`, {method: "POST", headers: {"X-API-Key": apiKey}})
      .then(response => response.json().then(data => ({response: response, body: data})))
    .then((data) => {
        if (data.response.ok) {
          this.updateTasks()
          return this.props.showToast("info", data.body.message)
        }
        else {
          throw Error(data.body.message)
        }
      })
      .catch((error: Error) => {
        return this.props.showToast("error", error.message)
      })
    })
  }

  deleteTask(id: number): void {
    this.modifyTask(id, "delete")
  }

  completeTask(id: number): void {
    this.modifyTask(id, "complete")
  }

  formatDateTime(date: Date): string {
    let addZeroIfNeeded = (s: string) => s.padStart(2, "0")
    let day = addZeroIfNeeded(`${date.getDate()}`)
    let month = addZeroIfNeeded(`${date.getMonth() + 1}`)
    let year = addZeroIfNeeded(`${date.getFullYear()}`)
    let hours = addZeroIfNeeded(`${date.getHours()}`)
    let minutes = addZeroIfNeeded(`${date.getMinutes()}`)
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  renderTaskLabels(timestamp: number, recurring: boolean): JSX.Element {
    let dateInPast = new Date(timestamp * 1000) <= new Date()
    let recurringLabel = recurring && <span className="IssueLabel bg-blue text-white">Recurring</span>
    let overdueLabel = dateInPast && <span className="IssueLabel bg-red text-white">Overdue</span>
    return (
      <span>
        {recurringLabel} {overdueLabel}
      </span>
    )
  }

  renderTasks(tasks: Array<Task>): JSX.Element[] {
    return (
      tasks.map((task) => {

        let taskAssignedToUser = task.assignedUser === this.props.profile?.id

        let renderCompleteButton = () => {
          if (taskAssignedToUser) {
            return (
            <button className="btn btn-primary" type="button" onClick={() => this.completeTask(task.id)}>
               <CheckIcon/>
             </button>
            )
          }
          return (
          <button className="btn btn-disabled" type="button" disabled>
            <CheckIcon/>
          </button>
        )
        }

        let renderDeleteButton = () => {
          if (taskAssignedToUser) {
            return (
              <div>
                <button className="btn-octicon btn-octicon-danger" type="button" onClick={() => this.deleteTask(task.id)}>
                  <TrashIcon/>
                </button>
              </div>
            )
          }
        }

        return (
         <div className="Box-row d-flex flex-items-center flex-justify-between" key={task.id}>

           <div className="mr-3">
             {renderCompleteButton()}
           </div>

           <div className="flex-1">
             <strong>{task.description}</strong>
             <div className="text-small text-gray-light">
                {task.deadline > 0 && <>{this.formatDateTime(new Date(task.deadline * 1000))}<br/></>}
                Assigned to {this.props.users.find(u => u.id === task.assignedUser)?.name ?? ""}
             </div>
             {task.deadline > 0 && this.renderTaskLabels(task.deadline, task.recurringInterval > 0)}
             {task.notes.length > 0 &&
             <details className="details-overlay text-small">
              <summary className="btn-link">Notes</summary>
                <div>{task.notes}</div>
            </details>}
           </div>

           {renderDeleteButton()}

         </div>
        )
     })
    )
  }

  render() {
    return (
      <div className="col-sm-10 col-md-10 col-lg-8 mx-auto">

        <div className="Box Box--spacious f4">
          <div className="Box-header">
            <h3 className="Box-title">
              Your tasks <span className="Counter Counter--gray-dark">{this.state.tasks.length}</span>
            </h3>
          </div>

          <AddTask
          profile={this.props.profile}
          users={this.props.users}
          groups={this.props.groups}
          withApiKey={this.props.withApiKey}
          updateTasks={this.updateTasks}
          showToast={this.props.showToast}
          />

          {this.renderTasks(this.state.tasks)}

        </div>

      </div>
    )
  }
}