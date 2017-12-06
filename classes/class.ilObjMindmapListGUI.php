<?php


include_once "./Services/Repository/classes/class.ilObjectPluginListGUI.php";

/**
* ListGUI implementation for Mindmap object plugin. This one
* handles the presentation in container items (categories, courses, ...)
* together with the corresponfing ...Access class.
*
* PLEASE do not create instances of larger classes here. Use the
* ...Access class to get DB data and keep it small.
*
* @author 		Aresch Yavari <ay@databay.de>
*/
class ilObjMindmapListGUI extends ilObjectPluginListGUI
{
	
	/**
	* Init type
	*/
	function initType()
	{
		$this->setType("xmmp");
	}
	
	/**
	* Get name of gui class handling the commands
	*/
	function getGuiClass()
	{
		return "ilObjMindmapGUI";
	}
	
	/**
	* Get commands
	*/
	function initCommands()
	{
		return array
		(
			array(
				"permission" => "read",
				"cmd" => "showContent",
				"default" => true),
			array(
				"permission" => "write",
				"cmd" => "editProperties",
				"txt" => $this->txt("edit"),
				"default" => false),
		);
	}

	/**
	* Get item properties
	*
	* @return	array		array of property arrays:
	*						"alert" (boolean) => display as an alert property (usually in red)
	*						"property" (string) => property name
	*						"value" (string) => property value
	*/
	function getProperties()
	{
		global $lng, $ilUser;

		$props = array();
		
		$this->plugin->includeClass("class.ilObjMindmapAccess.php");

		return $props;
	}
}
?>
