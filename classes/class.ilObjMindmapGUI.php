<?php

#include_once("./Services/Repository/classes/class.ilObjectPluginGUI.php");

/**
* User Interface class for mindmap repository object.
*
* User interface classes process GET and POST parameter and call
* application classes to fulfill certain tasks.
*
* @author Aresch Yavari <ay@databay.de>
*
* $Id$
*
* Integration into control structure:
* - The GUI class is called by ilRepositoryGUI
* - GUI classes used by this class are ilPermissionGUI (provides the rbac
*   screens) and ilInfoScreenGUI (handles the info screen).
*
* @ilCtrl_isCalledBy ilObjMindmapGUI: ilRepositoryGUI, ilAdministrationGUI, ilObjPluginDispatchGUI
* @ilCtrl_Calls ilObjMindmapGUI: ilPermissionGUI, ilInfoScreenGUI, ilObjectCopyGUI, ilCommonActionDispatcherGUI
*
*/
class ilObjMindmapGUI extends ilObjectPluginGUI
{
	/**
 	* Property form
  	*/
	private $form;

	/**
 	* Data directory
  	*/
	private $dataDir;

	/**
	* Initialisation
	*/
	protected function afterConstructor(): void
	{
	}
	
	/**
	* Get type.
	*/
	final function getType(): string
	{
		return "xmmp";
	}
	
	/**
	* Handles all commmands of this class, centralizes permission checks
	*/
	function performCommand(string $cmd): void
	{
		switch ($cmd)
		{
			case "editProperties":		
			case "updateProperties":
			
				$this->checkPermission("write");
				$this->$cmd();
				break;
			
			case "showContent":			
			
				$this->checkPermission("read");
				$this->$cmd();
				break;
			case "showEdit":			
				$this->checkPermission("read");
				$this->$cmd();
				break;
		}
	}

	/**
	* After object has been created -> jump to this command
	*/
	function getAfterCreationCmd(): string
	{
		return "editProperties";
	}

	/**
	* Get standard command
	*/
	function getStandardCmd(): string
	{
		return "showContent";
	}

	/**
	* show information screen
	*/
	function infoScreen(): void
	{
		global $ilAccess, $ilUser, $lng, $ilCtrl, $tpl, $ilTabs;

		$ilTabs->setTabActive("info_short");

		$this->checkPermission("visible");

		include_once("./Services/InfoScreen/classes/class.ilInfoScreenGUI.php");
		$info = new ilInfoScreenGUI($this);

		$info->addSection($this->txt("plugininfo"));
		$info->addProperty('Name', 'Mindmap');
		$info->addProperty('Version', xmmp_version);
		$info->addProperty('Developer', 'Aresch Yavari');
		$info->addProperty('Kontakt', 'ay@databay.de');
		$info->addProperty('&nbsp;', 'Databay AG');
		$info->addProperty('&nbsp;', '<img src="http://www.iliasnet.de/Pluginmanager/logo.php?plug=mindmap" alt="Databay AG" title="Databay AG" />');
		$info->addProperty('&nbsp;', "http://www.iliasnet.de");



		$info->enablePrivateNotes();

		
		$lng->loadLanguageModule("meta");

		$this->addInfoItems($info);


		
		$ret = $ilCtrl->forwardCommand($info);


		
	}
	
	/**
	* Set tabs
	*/
	function setTabs(): void
	{
		global $ilTabs, $ilCtrl, $ilAccess;
		
		
		if ($ilAccess->checkAccess("read", "", $this->object->getRefId()))
		{
			$ilTabs->addTab("content", $this->txt("mindmap"), $ilCtrl->getLinkTarget($this, "showContent"));
		}

		if ($ilAccess->checkAccess("write", "", $this->object->getRefId()))
		{
			$ilTabs->addTab("edit", $this->txt("editmap"), $ilCtrl->getLinkTarget($this, "showEdit"));
		}
                
		
		$this->addInfoTab();

		
		if ($ilAccess->checkAccess("write", "", $this->object->getRefId()))
		{
			$ilTabs->addTab("properties", $this->txt("properties"), $ilCtrl->getLinkTarget($this, "editProperties"));
		}

		
		$this->addPermissionTab();
	}
	

	/**
	* Edit Properties. This commands uses the form class to display an input form.
	*/
	function editProperties()
	{
		global $tpl, $ilTabs;
		
		$ilTabs->activateTab("properties");
		$this->initPropertiesForm();
		$this->getPropertiesValues();
		$tpl->setContent($this->form->getHTML());
	}
	
	/**
	* Init  form.
	*
	* @param        int        $a_mode        Edit Mode
	*/
	public function initPropertiesForm()
	{
		global $ilCtrl;
	
		include_once("Services/Form/classes/class.ilPropertyFormGUI.php");
		$this->form = new ilPropertyFormGUI();
	
		
		$ti = new ilTextInputGUI($this->txt("title"), "title");
		$ti->setRequired(true);
		$this->form->addItem($ti);
		
		
		$ta = new ilTextAreaInputGUI($this->txt("description"), "desc");
		$this->form->addItem($ta);
		

		$this->form->addCommandButton("updateProperties", $this->txt("save"));
	                
		$this->form->setTitle($this->txt("edit_properties"));
		$this->form->setFormAction($ilCtrl->getFormAction($this));
	}
	
	/**
	* Get values for edit properties form
	*/
	function getPropertiesValues()
	{
		$values["title"] = $this->object->getTitle();
		$values["desc"] = $this->object->getDescription();
		$this->form->setValuesByArray($values);
	}
	
	/**
	* Update properties
	*/
	public function updateProperties()
	{
		global $tpl, $lng, $ilCtrl;
	
		$this->initPropertiesForm();
		if ($this->form->checkInput())
		{
			$this->object->setTitle($this->form->getInput("title"));
			$this->object->setDescription($this->form->getInput("desc"));
			$this->object->update();
			ilUtil::sendSuccess($lng->txt("msg_obj_modified"), true);
			$ilCtrl->redirect($this, "editProperties");
		}

		$this->form->setValuesByPost();
		$tpl->setContent($this->form->getHtml());
	}
	


	/**
	* Show content
	*/
	function showContent()
	{
		global $tpl, $ilTabs;
		
		$ilTabs->activateTab("content");

                $this->dataDir = ilFileUtils::getDataDir().'/mindmap';
		if(!file_exists($this->dataDir)) ilFileUtils::makeDirParents($this->dataDir);
                
                $fn = $this->dataDir.'/mindmap_'.$this->object->getRefId().'.json';
                
                $data = "";
		if(file_exists($fn)) {
                    $data = file_get_contents($fn);
                }
                
                if($data=="") $data = '{"edges": [], "nodes": {"root": {"id": "root", "title":"Mindmap", "x":0, "y":0}}}';
                
                $D = json_decode($data, true);
                $intern = array();
                foreach($D['nodes'] as $key => $node) {
                	if(isset($node["linktype"]) && $node["linktype"]=="intern") {
                		if (is_file("./classes/class.ilLink.php")) include_once("./classes/class.ilLink.php");
                                else include_once("./Services/Link/classes/class.ilLink.php");
				$interlink = ilLink::_getLink($node['linktarget']);                                    
                		
                		$intern[$node['linktarget']] = $interlink;
                	}
                }
                
		$html = file_get_contents(dirname(__FILE__)."/../templates/mm_lang.html");
		$html .= file_get_contents(dirname(__FILE__)."/../templates/mm.html"); 
                $html = str_replace("#MINDMAPDATA#", $data, $html);
                $html = str_replace("#INTERNLINKS#", json_encode($intern), $html);
                
                $html = $this->translate($html);
                
		$tpl->setContent($html);
	}
        
	/**
	* Show content
	*/
	function showEdit()
	{
		global $tpl, $ilTabs;
		
		$ilTabs->activateTab("edit");

                $this->dataDir = ilFileUtils::getDataDir().'/mindmap';
		if(!file_exists($this->dataDir)) ilFileUtils::makeDirParents($this->dataDir);
                
                $fn = $this->dataDir.'/mindmap_'.$this->object->getRefId().'.json';
                
                if($_POST["sendmindmap"]==1) {
                    file_put_contents($fn, $_POST["mindmapdata"]);
                    file_put_contents($fn.".".date("YmdHis"), $_POST["mindmapdata"]);
                }
                
		if(file_exists($fn)) {
                    $data = file_get_contents($fn);
                }
                
                
                if(!isset($data) || $data=="") $data = '{"edges": [], "nodes": {"root": {"id": "root", "title":"Mindmap", "x":0, "y":0}}}';
                
                $html = file_get_contents(dirname(__FILE__)."/../templates/mm_lang.html");
		$html .= file_get_contents(dirname(__FILE__)."/../templates/mm_edit.html"); 
                $html = str_replace("#MINDMAPDATA#", $data, $html);
                
                $html = $this->translate($html);
                
		$tpl->setContent($html);
	}        
	
	private function translate($html) {
		
		$anz = preg_match_all("/#!(.*?)!#/", $html, $matches);
		
		for($i=0;$i<$anz;$i++) {
			$html = str_replace($matches[0][$i], $this->txt($matches[1][$i]), $html);
		}
		
		
		return $html;
	}
	

}
?>
