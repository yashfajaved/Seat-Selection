<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(0);
ini_set('display_errors', 0);

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "leohub_db";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "Connection failed"]);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$event_id = isset($data['event_id']) ? intval($data['event_id']) : 0;
$seat_ids = isset($data['seat_ids']) ? $data['seat_ids'] : [];

if ($event_id <= 0 || empty($seat_ids)) {
    echo json_encode(["success" => false, "error" => "Invalid data"]);
    exit();
}

// Update seat status to booked
$ids = implode(',', array_map('intval', $seat_ids));
$sql = "UPDATE seats_new SET status = 'booked' WHERE id IN ($ids) AND event_id = $event_id";

if ($conn->query($sql)) {
    echo json_encode(["success" => true, "message" => "Seats booked successfully"]);
} else {
    echo json_encode(["success" => false, "error" => "Failed to book seats"]);
}

$conn->close();
?>