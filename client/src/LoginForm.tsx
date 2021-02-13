import React, {Component} from "react"
import { API_URL } from "./Constants"
import { XIcon } from "@primer/octicons-react"

type Props = {
  handleSignIn: (apiKey: string) => void
}

type State = {
  username: string
  password: string
  error: string
}

export default class LoginForm extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      username: "",
      password: "",
      error: ""
    }
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.closeError = this.closeError.bind(this)
  }

  handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const value = event.currentTarget.type === "checkbox" ? event.currentTarget.checked : event.currentTarget.value
    this.setState({
      ...this.state,
      [event.currentTarget.name]: value
    })
   }

  showError(error: string) {
    this.setState({error: error})
  }

  closeError() {
    this.setState({error: ""})
  }

  handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    fetch(`${API_URL}/login`,
    {method: "POST", credentials: "same-origin", body: JSON.stringify({username: this.state.username, password: this.state.password})})
    .then(response => response.json().then(data => ({response: response, body: data})))
    .then((data) => {
      if (data.response.ok) {
        return this.props.handleSignIn(data.body.apiKey)
      }
      else {
        throw Error(data.body.message)
      }
      })
      .catch((error: Error) => {
        return this.setState({error: error.message})
      })
  }

  render() {
    return (
      <div className="col-4 mx-auto mt-5">

        <div className="text-center mb-3">
          <h3 className="f2-light mt-3">
            Sign in to Tasks
          </h3>
        </div>

        {this.state.error !== "" && 
          <div className="flash flash-error f6">
            {this.state.error}
            <button className="flash-close js-flash-close" type="button" onClick={this.closeError}>
              <XIcon/>
            </button>
          </div>}

        <div className="Box Box--spacious col-12 mx-auto mt-3 bg-gray">

          <form onSubmit={this.handleSubmit}>
            <div className="Box-body">

              <label className="d-inline-block mb-1" htmlFor="username">Username</label>
              <input className="form-control width-full mb-3" type="text" id="username" name="username" value={this.state.username} onChange={this.handleChange}/>

              <label className="d-inline-block mb-1" htmlFor="password">Password</label>
              <input className="form-control width-full" type="password" id="password" name="password" value={this.state.password} onChange={this.handleChange}/>

              <button type="submit" className="btn btn-primary btn-block mt-4">Sign in</button>

            </div>
          </form>
        </div>

      </div>
    );
  }
}