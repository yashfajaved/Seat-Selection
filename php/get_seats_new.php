<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(0);
ini_set('display_errors', 0);

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "leohub_db";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit();
}

$event_id = isset($_GET['event_id']) ? intval($_GET['event_id']) : 0;

if ($event_id <= 0) {
    echo json_encode(["error" => "Invalid event ID"]);
    exit();
}

$sql = "SELECT id, seat_row as `row`, seat_number as `number`, status, price 
        FROM seats_new 
        WHERE event_id = $event_id 
        ORDER BY seat_row, seat_number";

$result = $conn->query($sql);
$seats = [];

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $seats[] = $row;
    }
}

echo json_encode($seats);
$conn->close();
?>