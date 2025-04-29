function Col({type, name}){
    return(
        type === "head" ? <th scope="col" className="text-left py-3 px-4 uppercase font-semibold text-sm">{name}</th>:<td scope="col" className="text-left py-3 px-4"> {name} </td>
    )
}

export default Col;