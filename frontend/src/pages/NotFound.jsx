import { Link } from 'react-router';

export default function NotFound() {
    return (
        <div className="notFoundPage">
            <div className="notFoundCard">
                <h1 className="notFoundTitle">That page does not exist</h1>
                <p className="notFoundText">
                    The link may be out of date, or the class or assignment may have been removed.
                </p>

                <Link className="notFoundAction" to="/dashboard">
                    Go to your dashboard
                </Link>
            </div>
        </div>
    );
}