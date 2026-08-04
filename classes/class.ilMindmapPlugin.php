<?php

/**
* Mindmap repository object plugin
*
* @author Aresch Yavari <ay@databay.de>
* @version $Id$
*
*/
class ilMindmapPlugin extends ilRepositoryObjectPlugin
{
	protected function uninstallCustom(): void
	{
	}

	function getPluginName(): string
	{
		return "Mindmap";
	}
}
