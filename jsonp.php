<?php
//      $username = $_GET['username'];
//       $age = $_GET['password'];
        $username = 'zhangsan';
        $age = 'param';
       $cb = $_GET['cb'];
       $arr = array('username'=>$username,'password'=>$age);
       echo $cb.'('.json_encode($arr).')';
   
?>