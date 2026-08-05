<?php

/**
 * Mindmap configuration user interface class
 *
 * @author Aresch Yavari <ay@databay.de>
 * @version $Id$
 *
 * @ilCtrl_IsCalledBy ilMindmapConfigGUI: ilObjComponentSettingsGUI
 *
 */
class ilMindmapConfigGUI extends ilPluginConfigGUI
{
	protected ilGlobalTemplateInterface $tpl;
	protected ilCtrl $ctrl;
	protected ilLanguage $lng;

	public function __construct()
	{
		global $DIC;
		$this->tpl = $DIC['tpl'];
		$this->ctrl = $DIC->ctrl();
		$this->lng = $DIC->language();
	}

	/**
	* Handles all commands, default is "configure"
	*/
	public function performCommand(string $cmd): void
	{
		switch ($cmd) {
			case "configure":
			case "save":
				$this->$cmd();
				break;
		}
	}

	/**
	 * Configure screen
	 */
	public function configure(): void
	{
		$form = $this->initConfigurationForm();
		$this->tpl->setContent($form->getHTML());
	}

	/**
	 * Init configuration form.
	 */
	public function initConfigurationForm(): ilPropertyFormGUI
	{
		$pl = $this->getPluginObject();

		$form = new ilPropertyFormGUI();
		$form->addCommandButton("save", $this->lng->txt("save"));
		$form->setTitle($pl->txt("mindmap_plugin_configuration"));
		$form->setFormAction($this->ctrl->getFormAction($this));

		return $form;
	}

	/**
	 * Save form input (currently does not save anything to db)
	 */
	public function save(): void
	{
		$pl = $this->getPluginObject();

		$form = $this->initConfigurationForm();
		if ($form->checkInput()) {
			// @todo: implement saving to db
			$this->tpl->setOnScreenMessage("success", $pl->txt("saving_invoked"), true);
			$this->ctrl->redirect($this, "configure");
		}

		$form->setValuesByPost();
		$this->tpl->setContent($form->getHtml());
	}
}
