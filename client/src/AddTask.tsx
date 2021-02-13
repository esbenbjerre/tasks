import { CalendarIcon, ClockIcon, NoteIcon, OrganizationIcon, PeopleIcon, PersonIcon, StopwatchIcon, SyncIcon } from "@primer/octicons-react"
import React, {Component} from "react"
import { reduceEachTrailingCommentRange } from "typescript"
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
  date: string,
  time: string,
  recurringInterval: string,
  assignedGroup: string
  assignedUser: string
}

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
        date: "",
        time: "",
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

      let dateFormat = /\d{4}-\d{2}-\d{2}/
      let timeFormat = /\d{2}:\d{2}/
      
      if (this.state.date.length > 0 && !dateFormat.test(this.state.date)) {
        return this.props.showToast("error", "Please format the date as YYYY-DD-MM")
      }

      if (this.state.time.length > 0 && !timeFormat.test(this.state.time)) {
        return this.props.showToast("error", "Please format the time as HH:MM")
      }

      if (this.state.date.length > 0 && this.state.time.length == 0 || this.state.time.length > 0 && this.state.date.length == 0) {
        return this.props.showToast("info", "Due date must either be empty or include both date and time")
      }

      let deadline = this.state.date.length > 0 && this.state.date.length > 0 ? Time.toUnixTime(new Date(`${this.state.date}T${this.state.time}:00.000+01:00`)) : 0

      let body = JSON.stringify({
        description: this.state.description,
        notes: this.state.notes,
        deadline: deadline,
        recurringInterval: this.state.recurringInterval === "" ? null : Number(this.state.recurringInterval),
        assignedGroup: this.state.assignedGroup === "" ? null : Number(this.state.assignedGroup),
        assignedUser: Number(this.state.assignedUser)
      })

      console.log(body)

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
              <div className="col-12 mt-4">

                <div className="text-gray-light mt-2 d-flex flex-items-center">
                  <CalendarIcon/>
                  <input className="form-select select-sm flex-auto ml-2" type="date" id="date" name="date" placeholder="YYYY-MM-DD" onChange={this.handleChange}/>
                </div>

                <div className="text-gray-light mt-2 d-flex flex-items-center">
                  <ClockIcon/>
                  <input className="form-select select-sm flex-auto ml-2" type="time" id="time" name="time" placeholder="HH:MM" onChange={this.handleChange}/>
                </div>

                <div className="text-gray-light mt-2 d-flex flex-items-center">
                  <SyncIcon/>
                  <select className="form-select select-sm flex-auto ml-2" id="recurringInterval" name="recurringInterval" onChange={this.handleChange}>
                    <option value="">Recurring</option>
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
                    <option value="">Assigned team</option>
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