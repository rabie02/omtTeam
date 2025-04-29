import Row from "./Row";

function Table({colNames, colBodyContent, onDelete, onUpdateStatus, onUpdate, stateManage}){
    let rows= [];
    for(let i=0; i<colBodyContent.length; i++){
        rows.push(<Row type="body" colNames={colBodyContent[i]} deleteid={onDelete} onUpdateStatus={onUpdateStatus} onUpdate={onUpdate} stateManage={stateManage} />)
        
        
    }
    return(
        <div className="">
          <table className="table-auto border-collapse border border-gray-400">
            <thead>
                <Row type="head" colNames={colNames} />
            </thead>
            <tbody>
                {rows}
            </tbody>
        </table>
        </div>
    )
}
export default Table;