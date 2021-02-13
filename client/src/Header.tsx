import { PersonIcon } from "@primer/octicons-react"
import { Component } from "react"
import { UserProfile } from "./Models"

type Props = {
  profile: UserProfile | null
  handleSignOut: () => void
}

export default class Header extends Component<Props> {

  constructor(props: Props) {
    super(props)
  }

  render() {
    return (
      <div className="Header">
        <div className="Header-item Header-item--full"></div>

        <div className="Header-item mr-0">
          <details className="dropdown details-reset details-overlay d-inline-block">
            <summary>
              <PersonIcon/> <span className="dropdown-caret"></span>
            </summary>

            <div className="dropdown-menu dropdown-menu-sw dropdown-menu-dark mt-1">
              <div className="dropdown-header">
                Signed in as <p className="text-bold">{this.props.profile?.username}</p>
              </div>
              <ul>
                <li><a className="dropdown-item" href="#" onClick={this.props.handleSignOut}>Sign out</a></li>
              </ul>
            </div>
          </details>

      </div>
      </div>
    )
  }
 
}