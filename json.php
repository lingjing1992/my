<?php
   $username =$_GET['username'];
   $data =$_GET['password'];
   $arr = array('username'=>$username,'password'=>$data);
      echo json_encode($arr);

?>
