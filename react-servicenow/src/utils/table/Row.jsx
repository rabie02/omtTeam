import Col from "./Col";

function Row({type, colNames, deleteid, onUpdateStatus, onUpdate, stateManage=false }){
    if(colNames === ""){
        return
    }
    const state_button = stateManage ? colNames.status === "draft" ? <button  onClick={() => onUpdateStatus(colNames.id,colNames.status)}  className="btn btn-success mx-1">Publish</button> : <button onClick={() => onUpdateStatus(colNames.id,colNames.status)}  className="btn btn-warning mx-1 px-3">Retire</button> : "";
    const basedOnType = type === "head" ? <th className="w-3xs">Action</th> :  <td>
    {state_button}
    <button className="btn btn-secondary mx-1" onClick={()=> onUpdate(colNames.id)}>Update</button>
    <button onClick={() => deleteid(colNames.id)} className="btn btn-danger mx-1">Delete</button>
    </td>
    let row = []
    let content = Array.isArray(colNames) ? colNames.map((colname)=> <Col type={type} name={colname} />) : colNames.content?.map((colname)=> <Col type={type} name={colname} />);
    const key = colNames.id !== "" ? colNames.id : "" ;
    const htmlRow = <tr className={type === "head"? "bg-gray-400":""} key={key} id={key}>{content}{basedOnType}</tr>;
    row.push(htmlRow);
    return (<>
        {row}
        </>
    )
}

export default Row;