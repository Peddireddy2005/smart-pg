import {getMyPGs} from "../services/pgService";
import { useEffect, useState } from "react";
import {Link} from "react-router-dom";

function OwnerDashboard() {
    const [pgs, setPGs] = useState([]);
    useEffect(() => {
        const fetchPGs = async ()=>{
            try{
                const data = await getMyPGs();
                setPGs(data);
            } catch(error){
                console.log(error.response?.data);
                alert(
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to fetch PGs"
                );
            }
        };
        fetchPGs();
    },[]);


  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">
          My PGs
        </h1>

        <Link
          to="/owner/add-pg"
          className="bg-black text-white px-4 py-2 rounded"
        >
          + Add PG
        </Link>
      </div>

      <div className="grid gap-4">
        {pgs.map((pg) => (
          <div
            key={pg._id}
            className="border p-4 rounded shadow"
          >
            <h2 className="text-xl font-semibold">
              {pg.name}
            </h2>

            <p>{pg.address}</p>

            <p>{pg.description}</p>

            <p>₹ {pg.rentRange}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OwnerDashboard;