import {useState} from 'react';
import { useNavigate } from "react-router-dom";
import {createPG} from "../services/pgService";

function AddPG() {
    const navigate = useNavigate();
    const[fromData,setFormData] = useState({
        name:"",
        address:"",
        description:"",
        amenities: "",
        rentRange:"",
    });

    const handleChange = (e)=>{
        setFormData({
            ...fromData,
            [e.target.name]:e.target.value,
        });
    };

    const handleSubmit = async(e)=>{
        e.preventDefault();
        try{
            await createPG({...fromData,
                amenities: fromData.amenities.split(","),
            });
            alert("PG created successfully");
            navigate("/owner/dashboard");
        }catch(error){
            console.log(error.response?.data);
            alert(
                error.response?.data?.message ||
                error.message ||
                "Failed to create PG"
            );
        }
    };
    return(
        <div className="p-8 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-4">Add PG</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                    type="text"
                    name="name"
                    placeholder="PG Name"
                    onChange={handleChange}
                    className="border p-2 rounded"
                    required
                />
                <input
                    type="text"
                    name="address"
                    placeholder="Address"
                    onChange={handleChange}
                    className="border p-2 rounded"
                    required
                />
                <textarea
                    name="description"
                    placeholder="Description"
                    onChange={handleChange}
                    className="border p-2 rounded"
                    required
                />
                <input
                    type="text"
                    name="amenities"
                    placeholder="Amenities (comma-separated)"
                    onChange={handleChange}
                    className="border p-2 rounded"
                />
                <input
                    type="text"
                    name="rentRange"
                    placeholder="Rent Range"
                    onChange={handleChange}
                    className="border p-2 rounded"
                />
                <button
                    type="submit"
                    className="bg-black text-white p-2 rounded"
                >
                    Create PG
                </button>
            </form>
        </div>
    );
}
export default AddPG;