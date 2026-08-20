<?php

declare(strict_types=1);

class ilMindmapAccessRBACOperationClonedObjective extends ilAccessRBACOperationClonedObjective
{
	protected string $src_ops;
	protected string $dest_ops;

	public function __construct(string $type, string $src_ops, string $dest_ops)
	{
		parent::__construct($type, 0, 0);
		$this->src_ops = $src_ops;
		$this->dest_ops = $dest_ops;
	}

	public function getHash(): string
	{
		return hash(
			'sha256',
			self::class . $this->type . ':' . $this->src_ops . ':' . $this->dest_ops
		);
	}

	public function getLabel(): string
	{
		return "Clone rbac operation from $this->src_ops to $this->dest_ops";
	}

	public function achieve(ILIAS\Setup\Environment $environment): ILIAS\Setup\Environment
	{
		$db = $environment->getResource(ILIAS\Setup\Environment::RESOURCE_DATABASE);
		$this->src_id = (int) ilRbacReview::_getCustomRBACOperationId($this->src_ops, $db);
		$this->dest_id = (int) ilRbacReview::_getCustomRBACOperationId($this->dest_ops, $db);

		$env = parent::achieve($environment);

		$db->insert('settings', [
			'module' => ['text', $this->type],
			'keyword' => ['text', $this->getSettingsKeyword()],
			'value' => ['text', '1'],
		]);

		return $env;
	}

	public function isApplicable(ILIAS\Setup\Environment $environment): bool
	{
		$db = $environment->getResource(ILIAS\Setup\Environment::RESOURCE_DATABASE);

		$set = $db->queryF(
			'SELECT value FROM settings WHERE module = %s AND keyword = %s',
			['text', 'text'],
			[$this->type, $this->getSettingsKeyword()]
		);
		if ($rec = $db->fetchAssoc($set)) {
			if ($rec['value'] === '1') {
				return false;
			}
		}

		return true;
	}

	protected function getSettingsKeyword(): string
	{
		return 'copied_perm_' . $this->src_ops . '_' . $this->dest_ops;
	}
}
