
export default function List({Template, dataArray}){
  let listItems = dataArray.map((item)=> {
    return <Template {...item} />
  })

  return listItems;
}