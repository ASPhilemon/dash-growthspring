
export default function Table({head, body}){
  let tableHead;
  if (head){
    tableHead = head.map((item, index)=> <th key={index} scope="col">{ item }</th>)
  }
  let tableRows = []
  body.forEach((row)=>{
    let rowItems = []
    row.forEach((tableData, index)=>{
      rowItems.push(<td key={index} >{tableData}</td>)
    })
    tableRows.push(<tr>{rowItems}</tr>)
  })

  if (body.length === 0) return <p className="mt-2"> No data to display </p>

  return(
    <div className="table-responsive">
      <table className = "table table table-borderless" >
        <thead>
          {head && <tr> { tableHead } </tr>}
        </thead>
        <tbody className = 'table-group-dividerb'>
          {tableRows}
        </tbody>
      </table>
    </div>
  )
}