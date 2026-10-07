import { Link } from "../router";
import { Icon } from "../icons";

export default function NotFound() {
  return (
    <div className="container page-body narrow">
      <div className="panel notice">
        <Icon name="search" size={34} />
        <h1>This page does not exist</h1>
        <p>The link may be old or mistyped. Start again from the home page.</p>
        <div className="notice-actions">
          <Link to="/" className="btn btn-primary">
            Go to home
          </Link>
        </div>
      </div>
    </div>
  );
}
