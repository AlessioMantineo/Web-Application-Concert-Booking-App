import { useNavigate } from 'react-router-dom';
import {  Button, Table } from 'react-bootstrap';


// Component responsible for rendering a single row in the concert list table
function ConcertRow(props){
  const { concert } = props; // The concert data object for the current row

  const navigate = useNavigate(); // Hook to navigate to different routes

  // Function to format the concert date using the provided format or a default format
  const formatWatchDate = (dayJsDate, format= "YYYY-MM-DD") => {
    return dayJsDate ? dayJsDate.format(format) : '';
  }
    return (
        <tr className="custom-row">
          <td className="align-middle">
            <p className="mb-0">
              <i className="bi bi-music-note-list mx-2"></i>
              {concert.title}
              <i className="bi bi-music-note-list mx-2"></i>
            </p>
          </td>
          <td className="align-middle">
            <p className="mb-0">
            
              {formatWatchDate(concert.date)}
            </p>
          </td>
          <td className="align-middle text-center">
            <Button variant="info" onClick={() => navigate(`/concert/${concert.concert_id}`)}>
               <i className='bi bi-search'>
                </i></Button>
            
          </td>
                        
        </tr>
    );
}

// Component responsible for rendering the entire concert table
function ConcertTable(props) {
  const { ConcertList } = props; // The list of concerts to display in the table
    return (
      <>
        
        <div className="col-md-7 ">

        <Table striped bordered  className="mt-4 custom-table">
          <thead className="table-dark">
            <tr>
              <th >Title</th>
              <th ><i className="bi bi-calendar-event  mx-2"></i> Date</th>
              <th className="text-center">Info and Reservation</th>
            </tr>
          </thead>
          <tbody>
            {ConcertList.map((concert) => (
                <ConcertRow key={concert.concert_id}  concert={concert} 
                />
              ))}
              
          </tbody>
        </Table>
        </div>
      </>
    );
  }

  // Component responsible for rendering a single row in the ticket list table
  function TicketRow(props){
    const { ticket } = props; // The ticket data object for the current row

    return (
        <tr >
          <td className="align-middle">
            <p className="mb-0">
              {ticket.ticket_id}   
            </p>
          </td>
          <td className="align-middle">
            <p className="mb-0 custom-text">
            
              {ticket.concert_name}
            </p>
          </td>
          <td className="align-middle">
            <p className="mb-0">
            
              {ticket.seat_count}
            </p>
          </td>
          <td className="align-middle text-center">
            <Button variant="info" onClick={() => { props.delete(ticket.ticket_id) }}>
               <i className='bi bi-trash'>
                </i></Button>
            
          </td>
                        
        </tr>
    );
}

// Component responsible for rendering the entire ticket table
function TicketTable(props){
  const { TicketList } = props; // The list of tickets to display in the table

  return (
    <>
      
      <div >
        <h2 className="my-2"><i className="bi bi-ticket-perforated mx-2"></i>Your Tickets</h2>
        <Table className="custom-ticket-table">
          <thead >
            <tr>
              <th>Reservation Id</th>
              <th> Name of the Concert</th>
              <th className="text-center">Seats <i className="bi bi-person-arms-up "></i></th>
              <th className="text-center">Delete Reservation</th>
            </tr>
          </thead>
          <tbody>
            {TicketList.map((ticket) => (
              <TicketRow key={ticket.ticket_id} ticket={ticket} 
              delete={props.delete}/>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  );
}





export { ConcertTable,TicketTable };