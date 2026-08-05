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
	final public function getType(): string
	{
		return "xmmp";
	}

	/**
	* Handles all commands of this class, centralizes permission checks
	*/
	public function performCommand(string $cmd): void
	{
		switch ($cmd) {
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
	public function getAfterCreationCmd(): string
	{
		return "editProperties";
	}

	/**
	* Get standard command
	*/
	public function getStandardCmd(): string
	{
		return "showContent";
	}

	/**
	* show information screen
	*/
	public function infoScreen(): void
	{
		$this->tabs->setTabActive("info_short");

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

		$this->lng->loadLanguageModule("meta");

		$this->addInfoItems($info);

		$this->ctrl->forwardCommand($info);
	}

	/**
	* Set tabs
	*/
	public function setTabs(): void
	{
		if ($this->access->checkAccess("read", "", $this->object->getRefId())) {
			$this->tabs->addTab(
				"content",
				$this->txt("mindmap"),
				$this->ctrl->getLinkTarget($this, "showContent")
			);
		}

		if ($this->access->checkAccess("write", "", $this->object->getRefId())) {
			$this->tabs->addTab(
				"edit",
				$this->txt("editmap"),
				$this->ctrl->getLinkTarget($this, "showEdit")
			);
		}

		$this->addInfoTab();

		if ($this->access->checkAccess("write", "", $this->object->getRefId())) {
			$this->tabs->addTab(
				"properties",
				$this->txt("properties"),
				$this->ctrl->getLinkTarget($this, "editProperties")
			);
		}

		$this->addPermissionTab();
	}

	/**
	* Edit Properties. This commands uses the form class to display an input form.
	*/
	public function editProperties(): void
	{
		$this->tabs->activateTab("properties");
		$this->initPropertiesForm();
		$this->getPropertiesValues();
		$this->tpl->setContent($this->form->getHTML());
	}

	/**
	* Init form.
	*/
	public function initPropertiesForm(): void
	{
		$this->form = new ilPropertyFormGUI();

		$ti = new ilTextInputGUI($this->txt("title"), "title");
		$ti->setRequired(true);
		$this->form->addItem($ti);

		$ta = new ilTextAreaInputGUI($this->txt("description"), "desc");
		$this->form->addItem($ta);

		$this->form->addCommandButton("updateProperties", $this->txt("save"));

		$this->form->setTitle($this->txt("edit_properties"));
		$this->form->setFormAction($this->ctrl->getFormAction($this));
	}

	/**
	* Get values for edit properties form
	*/
	public function getPropertiesValues(): void
	{
		$values["title"] = $this->object->getTitle();
		$values["desc"] = $this->object->getDescription();
		$this->form->setValuesByArray($values);
	}

	/**
	* Update properties
	*/
	public function updateProperties(): void
	{
		$this->initPropertiesForm();
		if ($this->form->checkInput()) {
			$this->object->setTitle($this->form->getInput("title"));
			$this->object->setDescription($this->form->getInput("desc"));
			$this->object->update();
			$this->tpl->setOnScreenMessage("success", $this->lng->txt("msg_obj_modified"), true);
			$this->ctrl->redirect($this, "editProperties");
		}

		$this->form->setValuesByPost();
		$this->tpl->setContent($this->form->getHtml());
	}

	/**
	* Show content
	*/
	public function showContent(): void
	{
		$this->tabs->activateTab("content");

		$data = $this->object->getMindmapDataOrDefault();

		$D = json_decode($data, true);
		$intern = [];
		if (is_array($D) && isset($D['nodes']) && is_array($D['nodes'])) {
			foreach ($D['nodes'] as $node) {
				if (isset($node["linktype"]) && $node["linktype"] == "intern") {
					$intern[$node['linktarget']] = ilLink::_getLink($node['linktarget']);
				}
			}
		}

		$html = file_get_contents(dirname(__FILE__) . "/../templates/mm_lang.html");
		$html .= file_get_contents(dirname(__FILE__) . "/../templates/mm.html");
		$html = str_replace("#MINDMAPDATA#", $this->encodeMindmapDataForJs($data), $html);
		$html = str_replace(
			"#INTERNLINKS#",
			json_encode($intern, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT),
			$html
		);
		$html = str_replace("#ASSETPATH#", $this->getMindmapAssetPath(), $html);

		$html = $this->translate($html);

		$this->tpl->setContent($html);
	}

	/**
	* Edit mindmap
	*/
	public function showEdit(): void
	{
		$this->tabs->activateTab("edit");

		$data = $this->object->getMindmapDataOrDefault();

		$html = file_get_contents(dirname(__FILE__) . "/../templates/mm_lang.html");
		$html .= file_get_contents(dirname(__FILE__) . "/../templates/mm_edit.html");
		$html = str_replace("#MINDMAPDATA#", $this->encodeMindmapDataForJs($data), $html);
		$html = str_replace("#ASSETPATH#", $this->getMindmapAssetPath(), $html);
		$html = str_replace(
			"#FORMACTION#",
			htmlspecialchars($this->ctrl->getFormAction($this, "saveMindmap"), ENT_QUOTES, 'UTF-8'),
			$html
		);

		$html = $this->translate($html);

		$this->tpl->setContent($html);
	}

	/**
	 * Persist mindmap JSON (POST + CSRF via form action).
	 */
	protected function saveMindmap(): void
	{
		$raw = (string) ($_POST["mindmapdata"] ?? '');
		$error = $this->object->validateMindmapData($raw);
		if ($error !== null) {
			$this->tpl->setOnScreenMessage("failure", $this->txt($error), true);
			$this->ctrl->redirect($this, "showEdit");
		}

		$this->object->saveMindmapData($raw);
		$this->tpl->setOnScreenMessage("success", $this->txt("saving_invoked"), true);
		$this->ctrl->redirect($this, "showEdit");
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

	private function translate(string $html): string
	{
		$anz = preg_match_all("/#!(.*?)!#/", $html, $matches);

		for ($i = 0; $i < $anz; $i++) {
			$html = str_replace($matches[0][$i], $this->txt($matches[1][$i]), $html);
		}

		return $html;
	}
}
