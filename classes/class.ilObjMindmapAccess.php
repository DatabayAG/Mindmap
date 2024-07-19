<?php

#include_once("./Services/Repository/PluginSlot/class.ilObjectPluginAccess.php");

/**
* Access/Condition checking for Mindmap object
*
* Please do not create instances of large application classes (like ilObjMindmap)
* Write small methods within this class to determin the status.
*
* @author 		Aresch Yavari <ay@databay.de>
* @version $Id$
*/
class ilObjMindmapAccess extends ilObjectPluginAccess
{

	/**
	* Checks wether a user may invoke a command or not
	* (this method is called by ilAccessHandler::checkAccess)
	*
	* Please do not check any preconditions handled by
	* ilConditionHandler here. Also don't do usual RBAC checks.
	*
	* @param	string		$a_cmd			command (not permission!)
 	* @param	string		$a_permission	permission
	* @param	int			$a_ref_id		reference id
	* @param	int			$a_obj_id		object id
	* @param	int			$a_user_id		user id (if not provided, current user is taken)
	*
	* @return	boolean		true, if everything is ok
	*/
	function _checkAccess(string $cmd, string $permission, int $ref_id, int $obj_id, ?int $user_id = null): bool
	{
		global $ilUser, $ilAccess;

		if (!isset($user_id) || $user_id == "")
		{
			$user_id = $ilUser->getId();
		}

		switch ($permission)
		{
			case "read":
				if (!$ilAccess->checkAccessOfUser($user_id, "write", "", $ref_id))
				{
					#return false;
				}
				break;
		}

		return true;
	}
	
	
}

?>
