<?php

include_once("./Services/Repository/classes/class.ilObjectPlugin.php");

/**
* Application class for mindmap repository object.
*
* @author Aresch Yavari <ay@databay.de>
*
* $Id$
*/
class ilObjMindmap extends ilObjectPlugin
{
	/**
	* Constructor
	*
	* @access	public
	*/
	function __construct($a_ref_id = 0)
	{
		parent::__construct($a_ref_id);
	}
	

	/**
	* Get type.
	* The initType() method must set the same ID as the plugin ID.
	*/
	final function initType()
	{
		$this->setType("xmmp");
	}
	
	/**
	* Create object
	* This method is called, when a new repository object is created.
	* The Object-ID of the new object can be obtained by $this->getId().
	* You can store any properties of your object that you need.
	* It is also possible to use multiple tables.
	* Standard properites like title and description are handled by the parent classes.
	*/
	function doCreate()
	{
		global $ilDB;
		// $myID = $this->getId();

	}
	
	/**
	* Read data from db
	* This method is called when an instance of a repository object is created and an existing Reference-ID is provided to the constructor.
	* All you need to do is to read the properties of your object from the database and to call the corresponding set-methods.
	*/
	function doRead()
	{
		global $ilDB;
		// $myID = $this->getId();

	}
	
	/**
	* Update data
	* This method is called, when an existing object is updated.
	*/
	function doUpdate()
	{
		global $ilDB;
		// $myID = $this->getId();

	}
	
	/**
	* Delete data from db
	* This method is called, when a repository object is finally deleted from the system.
	* It is not called if an object is moved to the trash.
	*/
	function doDelete()
	{
		global $ilDB;
		// $myID = $this->getId();
		
	}
	
	/**
	* Do Cloning
	* This method is called, when a repository object is copied.
	*/
	function doClone($a_target_id,$a_copy_id,$new_obj)
	{
		global $ilDB;

	}
	

}
?>
