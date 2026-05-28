import {useParams,Link} from "react-router-dom";

function OwnerPGDetails(){
    const {pgId}=useParams();
    return(
        <div>
            <h1>PG Details for ID: {pgId}</h1>
            <Link to={`/owner/pg/${pgId}/add-room`}>
                + Add Room
            </Link>
        </div>
    );
}

export default OwnerPGDetails;