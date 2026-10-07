import { Link } from "../router";
import { Icon } from "../icons";

export default function DonorNotFound() {
  return (
    <div className="container page-body narrow">
      <div className="panel notice">
        <Icon name="user" size={34} />
        <h1>We could not find that donor</h1>
        <p>
          No donor is registered with that contact number, or the record has been removed. Check the number or register
          as a new donor.
        </p>
        <div className="notice-actions">
          <Link to="/register" className="btn btn-primary">
            Register as donor
          </Link>
          <Link to="/login" className="btn btn-ghost">
            Try another number
          </Link>
        </div>
      </div>
    </div>
  );
}
