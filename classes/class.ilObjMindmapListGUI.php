<?php

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
	public function initType(): void
	{
		$this->setType("xmmp");
	}

	/**
	* Get name of gui class handling the commands
	*/
	public function getGuiClass(): string
	{
		return "ilObjMindmapGUI";
	}

	/**
	* Get commands
	*/
	public function initCommands(): array
	{
		return [
			[
				"permission" => "read",
				"cmd" => "showContent",
				"default" => true,
			],
			[
				"permission" => "edit_map",
				"cmd" => "showEdit",
				"txt" => $this->txt("edit_map"),
				"default" => false,
			],
			[
				"permission" => "write",
				"cmd" => "showEdit",
				"txt" => $this->txt("edit_map"),
				"default" => false,
			],
			[
				"permission" => "write",
				"cmd" => "editProperties",
				"txt" => $this->txt("edit_properties"),
				"default" => false,
			],
		];
	}

	/**
	* Get item properties
	*
	* @return	array		array of property arrays:
	*						"alert" (boolean) => display as an alert property (usually in red)
	*						"property" (string) => property name
	*						"value" (string) => property value
	*/
	public function getProperties(): array
	{
		return [];
	}
}
