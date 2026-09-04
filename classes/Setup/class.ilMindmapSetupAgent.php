<?php

declare(strict_types=1);

use ILIAS\Setup;
use ILIAS\Refinery\Factory as Refinery;
use ILIAS\Data\Factory as DataFactory;

/**
 * Setup agent for the Mindmap plugin
 */
class ilMindmapSetupAgent extends ilPluginDefaultAgent
{
	public function __construct(
		Refinery $refinery,
		DataFactory $data_factory,
		ilLanguage $lng
	) {
		parent::__construct('Mindmap');
	}

	public function getInstallObjective(Setup\Config $config = null): Setup\Objective
	{
		return new Setup\ObjectiveCollection(
			'Install Mindmap plugin',
			false,
			parent::getInstallObjective($config),
			...$this->getRbacObjectives()
		);
	}

	public function getUpdateObjective(Setup\Config $config = null): Setup\Objective
	{
		return new Setup\ObjectiveCollection(
			'Update Mindmap plugin',
			false,
			parent::getUpdateObjective($config),
			...$this->getRbacObjectives()
		);
	}

	/**
	 * @return list<Setup\Objective>
	 */
	protected function getRbacObjectives(): array
	{
		return [
			new ilAccessRbacStandardOperationsAddedObjective('xmmp'),
			new ilAccessCustomRBACOperationAddedObjective(
				'edit_map',
				'Edit Map',
				'object',
				3100,
				['xmmp']
			),
			new ilMindmapAccessRBACOperationClonedObjective(
				'xmmp',
				'write',
				'edit_map'
			),
			new ilMindmapAccessRBACOperationClonedObjective(
				'xmmp',
				'write',
				'copy'
			),
		];
	}
}
