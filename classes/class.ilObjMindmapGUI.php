<?php

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
	protected ?ilPropertyFormGUI $form = null;

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
			case "saveMindmap":
				$this->checkPermission("write");
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

		$info = new ilInfoScreenGUI($this);

		$info->addSection($this->txt("plugininfo"));
		$info->addProperty('Name', $this->plugin->getPluginName());
		$info->addProperty('Version', $this->plugin->getVersion());
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
			$this->tpl->setOnScreenMessage("success", $lng->txt("msg_obj_modified"), true);
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

                $data = $this->object->getMindmapDataOrDefault();

                $D = json_decode($data, true);
                $intern = array();
                if (is_array($D) && isset($D['nodes']) && is_array($D['nodes'])) {
                foreach($D['nodes'] as $key => $node) {
                	if(isset($node["linktype"]) && $node["linktype"]=="intern") {
				$interlink = ilLink::_getLink($node['linktarget']);

                		$intern[$node['linktarget']] = $interlink;
                	}
                }
                }

                $html = file_get_contents(dirname(__FILE__)."/../templates/mm_lang.html");
		$html .= file_get_contents(dirname(__FILE__)."/../templates/mm.html");
                $html = str_replace("#MINDMAPDATA#", $this->encodeMindmapDataForJs($data), $html);
                $html = str_replace("#INTERNLINKS#", json_encode($intern, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT), $html);
                $html = str_replace("#ASSETPATH#", $this->getMindmapAssetPath(), $html);

                $html = $this->translate($html);

		$tpl->setContent($html);
	}

	/**
	* Edit mindmap
	*/
	function showEdit()
	{
		global $tpl, $ilTabs, $ilCtrl;

		$ilTabs->activateTab("edit");

                $data = $this->object->getMindmapDataOrDefault();

                $html = file_get_contents(dirname(__FILE__)."/../templates/mm_lang.html");
		$html .= file_get_contents(dirname(__FILE__)."/../templates/mm_edit.html");
                $html = str_replace("#MINDMAPDATA#", $this->encodeMindmapDataForJs($data), $html);
                $html = str_replace("#ASSETPATH#", $this->getMindmapAssetPath(), $html);
                $html = str_replace("#FORMACTION#", htmlspecialchars($ilCtrl->getFormAction($this, "saveMindmap"), ENT_QUOTES, 'UTF-8'), $html);

                $html = $this->translate($html);

		$tpl->setContent($html);
	}

	/**
	 * Persist mindmap JSON (POST + CSRF via form action).
	 */
	protected function saveMindmap(): void
	{
		global $ilCtrl;

		$raw = (string) ($_POST["mindmapdata"] ?? '');
		$error = $this->object->validateMindmapData($raw);
		if ($error !== null) {
			$this->tpl->setOnScreenMessage("failure", $this->txt($error), true);
			$ilCtrl->redirect($this, "showEdit");
		}

		$this->object->saveMindmapData($raw);
		$this->tpl->setOnScreenMessage("success", $this->txt("saving_invoked"), true);
		$ilCtrl->redirect($this, "showEdit");
	}

	/**
	 * Web-relative path to the mindmap/ asset directory (under public/).
	 */
	private function getMindmapAssetPath(): string
	{
		return rtrim($this->plugin->getRelativeDirectory(), '/') . '/mindmap';
	}

	/**
	 * Re-encode stored JSON for safe embedding inside a <script> block.
	 */
	private function encodeMindmapDataForJs(string $data): string
	{
		$decoded = json_decode($data, true);
		if (!is_array($decoded)) {
			$decoded = json_decode(ilObjMindmap::DEFAULT_MAP_JSON, true);
		}
		return (string) json_encode(
			$decoded,
			JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE
		);
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
