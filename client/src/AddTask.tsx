import { NoteIcon, OrganizationIcon, PeopleIcon, PersonIcon, StopwatchIcon, SyncIcon } from "@primer/octicons-react"
import React, {Component} from "react"
import { API_URL } from "./Constants"
import { UserProfile, Identifiable, ToastType } from "./Models"
import { Time } from "./Time"

type Props = {
  profile: UserProfile | null
  users: Array<Identifiable>
  groups: Array<Identifiable>
  withApiKey: (f: (apiKey: string) => void) => void
  updateTasks: () => void
  showToast: (type: ToastType, message: string) => void
}

type State = {
  description: string,
  notes: string,
  deadline: string,
  recurringInterval: string,
  assignedGroup: string
  assignedUser: string
}

const deadlineOptions = ["5 minutes", "10 minutes", "30 minutes", "1 hour", "1 day", "1 week", "1 month", "1 year"]
const recurringIntervalOptions = ["hourly", "daily", "weekly", "monthly", "yearly"]

const capitalize = (s: string) => {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default class AddTask extends Component<Props, State> {

    constructor(props: Props) {
      super(props)
      this.state = {
        description: "",
        notes: "",
        deadline: "",
        recurringInterval: "",
        assignedGroup: "",
        assignedUser: ""
      }
      this.handleChange = this.handleChange.bind(this)
      this.handleSubmit = this.handleSubmit.bind(this)
    }

    handleChange(event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLTextAreaElement>): void {
      this.setState({
        ...this.state,
        [event.currentTarget.name]: event.currentTarget.value
      })
     }

    handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
      event.preventDefault()

      let now = new Date()
      let deadline = 0
      switch (this.state.deadline) {
        case "5 minutes":
          deadline = Time.toUnixTime(Time.addToDate(now, 5, "minute"))
          break
        case "10 minutes":
          deadline = Time.toUnixTime(Time.addToDate(now, 10, "minute"))
          break
        case "30 minutes":
          deadline = Time.toUnixTime(Time.addToDate(now, 30, "minute"))
          break
        case "1 hour":
          deadline = Time.toUnixTime(Time.addToDate(now, 1, "hour"))
          break
        case "1 day":
          deadline = Time.toUnixTime(Time.addToDate(now, 1, "day"))
          break
        case "1 week":
          deadline = Time.toUnixTime(Time.addToDate(now, 1, "week"))
          break
        case "1 month":
          deadline = Time.toUnixTime(Time.addToDate(now, 1, "month"))
          break
        case "1 year":
          deadline = Time.toUnixTime(Time.addToDate(now, 1, "year"))
          break
      }

      let body = JSON.stringify({
        description: this.state.description,
        notes: this.state.notes,
        deadline: deadline,
        recurringInterval: this.state.recurringInterval === "" ? null : Number(this.state.recurringInterval),
        assignedGroup: this.state.assignedGroup === "" ? null : Number(this.state.assignedGroup),
        assignedUser: Number(this.state.assignedUser)
      })

      this.props.withApiKey(apiKey => {
        fetch(`${API_URL}/tasks/create`,
        {method: "POST", headers: {"X-API-Key": apiKey}, body: body})
        .then(response => response.json().then(data => ({response: response, body: data})))
        .then((data) => {
          if (data.response.ok) {
            this.props.updateTasks()
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

    render() {
      return (
          <div className="Box-row f5">
          <form onSubmit={this.handleSubmit}>

            <div className="form-group">
              <div className="form-group-header">
                <label htmlFor="description">Task</label>
              </div>
              <div className="form-group-body">
                <input className="form-control width-full" type="text" id="description" name="description" onChange={this.handleChange}/>
              </div>
            </div>

            <div className="form-actions">
            <button className="btn btn-outline" type="submit">Add</button>

            <details>
              <summary className="btn-link">Options</summary>
              <div className="col-8">

                <div className="text-gray-light mt-2 d-flex flex-items-center">
                  <StopwatchIcon/>
                  <select className="form-select select-sm flex-auto ml-2" id="deadline" name="deadline" onChange={this.handleChange}>
                    <option value="">Deadline (optional)</option>
                    {deadlineOptions.map(deadline => {
                      return (
                        <option key={deadline} value={deadline}>{capitalize(deadline)}</option>
                      )
                    })}
                  </select>
                </div>

                <div className="text-gray-light mt-2 d-flex flex-items-center">
                  <SyncIcon/>
                  <select className="form-select select-sm flex-auto ml-2" id="recurringInterval" name="recurringInterval" onChange={this.handleChange}>
                    <option value="">Recurring (optional)</option>
                    {recurringIntervalOptions.map((interval, i) => {
                      return (
                        <option key={interval} value={i}>{capitalize(interval)}</option>
                      )
                    })}
                  </select>
                </div>

                <div className="text-gray-light mt-2 d-flex flex-items-center">
                  <OrganizationIcon/>
                  <select className="form-select select-sm flex-auto ml-2" id="assignedGroup" name="assignedGroup" onChange={this.handleChange}>
                    <option value="">Assigned team (optional)</option>
                    {this.props.groups.map(group => {
                      return (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      )
                    })}
                  </select>
                </div>

                  <div className="text-gray-light mt-2 d-flex flex-items-center">
                  <PersonIcon/>
                    <select className="form-select select-sm flex-auto ml-2" id="assignedUser" name="assignedUser" value={this.props.profile?.id} onChange={this.handleChange}>
                      {this.props.users.map(user => {
                        return (
                          <option key={user.id} value={user.id}>{user.name}</option>
                        )
                      })}
                    </select>
                </div>

                <div className="text-gray-light mt-2 d-flex flex-items-center">
                <NoteIcon/>
                  <textarea className="form-control input-sm flex-auto ml-2" rows={2} id="notes" name="notes" onChange={this.handleChange} placeholder="Notes"></textarea>
                </div>

              </div>
            </details>

            </div>

          </form>
        </div>
      )
    }

}