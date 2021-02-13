import {Component} from "react"
import LoginForm from "./LoginForm"
import Tasks from "./Tasks"
import {Identifiable, Task, UserProfile, Toast, ToastType} from "./Models"
import Header from "./Header"
import { API_URL } from "./Constants"
import { AlertIcon, CheckIcon, InfoIcon, StopIcon, XIcon } from "@primer/octicons-react"

type State = {
  authenticated: boolean
  profile: UserProfile | null
  users: Array<Identifiable>
  groups: Array<Identifiable>
  toast: Toast | null
}

export default class App extends Component<{}, State> {

  constructor(props: {}) {
    super(props)
    this.state = {
      authenticated: false,
      profile: null,
      users: [],
      groups: [],
      toast: null
    }
    this.handleSignIn = this.handleSignIn.bind(this)
    this.handleSignOut = this.handleSignOut.bind(this)
    this.showToast = this.showToast.bind(this)
    this.closeToast = this.closeToast.bind(this)
  }

  componentDidMount() {
    this.authorize()
  }

  withApiKey(f: (apiKey: string) => void): void {
    let apiKey = localStorage.getItem("apiKey")
    if (apiKey !== null && apiKey !== "") {
      f(apiKey)
    }
  }

  authorize() {
    this.withApiKey(_ => this.setState({authenticated: true}, () => {
      this.updateProfile()
      this.updateUsers()
      this.updateGroups()
    }))
  }

  handleSignIn(apiKey: string) {
    localStorage.setItem("apiKey", apiKey)
    this.authorize()
  }

  handleSignOut() {
    localStorage.removeItem("apiKey")
    this.setState({authenticated: false})
  }

  getWithApiKey(endpoint: string, f: (data: any) => void): void {
    this.withApiKey(apiKey => {
      fetch(`${API_URL}/${endpoint}`, {headers: {"X-API-Key": apiKey}})
      .then(response => response.json())
      .then(data => {
        f(data)
      })
    })
  }

  updateProfile(): void {
    this.getWithApiKey("profile", data => this.setState({profile: data as UserProfile}))
  }

  updateUsers(): void {
    this.getWithApiKey("users", data => this.setState({users: data as Array<Identifiable>}))
  }

  updateGroups(): void {
    this.getWithApiKey("groups", data => this.setState({groups: data as Array<Identifiable>}))
  }

  showToast(type: ToastType, message: string) {
    this.setState({toast: {type: type, message: message, closingInSeconds: 6}})
    let timer = setInterval(() => {
      let toast = this.state.toast
      if (toast !== null) {
        if (toast.closingInSeconds <= 1) {
          clearInterval(timer)
          this.closeToast()
        }
        else {
          this.setState({toast: {type: toast.type, message: toast.message, closingInSeconds: toast.closingInSeconds - 1}})
        }
      }
    }, 1000)
  }

  closeToast() {
    this.setState({toast: null})
  }

  render() {
    return (
      <>
        {this.state.authenticated &&
        <Header
        profile={this.state.profile}
        handleSignOut={this.handleSignOut}
        />}
        <div className="container-lg">
          <div className="col-sm-12 col-md-10 col-lg-10 mx-auto p-3">
              {!this.state.authenticated &&
              <LoginForm handleSignIn={this.handleSignIn}/>}
              {this.state.authenticated &&
              <Tasks
                profile={this.state.profile}
                users={this.state.users}
                groups={this.state.groups}
                withApiKey={this.withApiKey}
                getWithApiKey={this.getWithApiKey}
                showToast={this.showToast}
              />}
          </div>
        </div>

        {this.state.toast !== null &&
        <div className="position-fixed bottom-0 right-0 mb-2 mr-2">
          <div className={`Toast Toast--${this.state.toast.type}`}>
            <span className="Toast-icon">
              {this.state.toast.type === "info" && <InfoIcon/>}
              {this.state.toast.type === "success" && <CheckIcon/>}
              {this.state.toast.type === "warning" && <AlertIcon/>}
              {this.state.toast.type === "error" && <StopIcon/>}
            </span>
            <span className="Toast-content">
              {this.state.toast.message}
              </span>
            <button className="Toast-dismissButton" onClick={this.closeToast}>
              <XIcon/>
            </button>
          </div>
        </div>}
      </>
    )
  }

}