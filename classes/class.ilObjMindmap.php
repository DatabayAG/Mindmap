<?php

/**
* Application class for mindmap repository object.
*
* @author Aresch Yavari <ay@databay.de>
*
* $Id$
*/
class ilObjMindmap extends ilObjectPlugin
{
	/** @var list<int> */
	private array $refs_to_cleanup = [];

	public const DEFAULT_MAP_JSON = '{"edges": [], "nodes": {"root": {"id": "root", "title":"Mindmap", "x":0, "y":0}}}';
	private const MAX_JSON_BYTES = 2097152; // 2 MiB
	private const MAX_NODES = 2000;

	/**
	* Constructor
	*
	* @access	public
	*/
	public function __construct($a_ref_id = 0)
	{
		parent::__construct($a_ref_id);
	}

	/**
	* Get type.
	* The initType() method must set the same ID as the plugin ID.
	*/
	final protected function initType(): void
	{
		$this->setType("xmmp");
	}

	protected function doCreate(bool $clone_mode = false): void
	{
	}

	protected function doRead(): void
	{
	}

	protected function doUpdate(): void
	{
	}

	protected function beforeDelete(): bool
	{
		$this->refs_to_cleanup = array_map(
			'intval',
			array_keys(ilObject::_getAllReferences($this->getId()))
		);
		return true;
	}

	/**
	 * Remove mindmap JSON and timestamped backups when the object is finally deleted.
	 */
	protected function doDelete(): void
	{
		$this->deleteDataFiles(self::getDataFilePathByObjId($this->getId()));
		foreach ($this->refs_to_cleanup as $ref_id) {
			if ($ref_id > 0) {
				$this->deleteDataFiles(self::getDataFilePathByRefId($ref_id));
			}
		}
	}

	/**
	 * Copy mindmap content to the newly created object.
	 */
	protected function doCloneObject(ilObject2 $new_obj, int $a_target_id, ?int $a_copy_id = null): void
	{
		if (!$new_obj instanceof self) {
			return;
		}

		$data = $this->getMindmapData();
		if ($data !== '') {
			$new_obj->saveMindmapData($data);
		}
	}

	public static function getDataDirectory(): string
	{
		$dir = ilFileUtils::getDataDir() . '/mindmap';
		if (!is_dir($dir)) {
			ilFileUtils::makeDirParents($dir);
		}
		return $dir;
	}

	public static function getDataFilePathByObjId(int $obj_id): string
	{
		return self::getDataDirectory() . '/mindmap_obj_' . $obj_id . '.json';
	}

	/**
	 * Legacy path used before ILIAS 10 lifecycle fix (keyed by ref_id).
	 */
	public static function getDataFilePathByRefId(int $ref_id): string
	{
		return self::getDataDirectory() . '/mindmap_' . $ref_id . '.json';
	}

	/**
	 * Load JSON for this object. Migrates legacy ref_id files to obj_id on read.
	 */
	public function getMindmapData(): string
	{
		$obj_path = self::getDataFilePathByObjId($this->getId());
		if (is_file($obj_path)) {
			return (string) file_get_contents($obj_path);
		}

		$ref_id = $this->getRefId();
		if ($ref_id > 0) {
			$legacy = self::getDataFilePathByRefId($ref_id);
			if (is_file($legacy)) {
				$data = (string) file_get_contents($legacy);
				file_put_contents($obj_path, $data);
				// Drop legacy ref_id file + backups after successful migration
				$this->deleteDataFiles($legacy);
				return $data;
			}
		}

		return '';
	}

	public function getMindmapDataOrDefault(): string
	{
		$data = $this->getMindmapData();
		return $data !== '' ? $data : self::DEFAULT_MAP_JSON;
	}

	/**
	 * Validate mindmap JSON payload. Returns a language variable on failure, null on success.
	 */
	public function validateMindmapData(string $json): ?string
	{
		if ($json === '' || strlen($json) > self::MAX_JSON_BYTES) {
			return "mindmap_invalid_data";
		}

		$data = json_decode($json, true);
		if (!is_array($data) || json_last_error() !== JSON_ERROR_NONE) {
			return "mindmap_invalid_data";
		}

		if (!isset($data['edges'], $data['nodes']) || !is_array($data['edges']) || !is_array($data['nodes'])) {
			return "mindmap_invalid_data";
		}

		if (count($data['nodes']) > self::MAX_NODES || count($data['edges']) > self::MAX_NODES) {
			return "mindmap_invalid_data";
		}

		if (!isset($data['nodes']['root']) || !is_array($data['nodes']['root'])) {
			return "mindmap_invalid_data";
		}

		foreach ($data['nodes'] as $id => $node) {
			if (!is_string($id) || $id === '' || !is_array($node)) {
				return "mindmap_invalid_data";
			}
			if (!isset($node['id']) || (string) $node['id'] !== $id) {
				return "mindmap_invalid_data";
			}
		}

		foreach ($data['edges'] as $edge) {
			if (!is_array($edge) || !isset($edge['from'], $edge['to'])) {
				return "mindmap_invalid_data";
			}
			if (!is_string($edge['from']) || !is_string($edge['to'])) {
				return "mindmap_invalid_data";
			}
		}

		return null;
	}

	public function saveMindmapData(string $json): void
	{
		if ($this->validateMindmapData($json) !== null) {
			throw new InvalidArgumentException('Invalid mindmap JSON');
		}

		$path = self::getDataFilePathByObjId($this->getId());
		file_put_contents($path, $json);
		file_put_contents($path . '.' . date('YmdHis'), $json);
	}

	private function deleteDataFiles(string $path): void
	{
		if (is_file($path)) {
			unlink($path);
		}
		foreach (glob($path . '.*') ?: [] as $backup) {
			if (is_file($backup)) {
				unlink($backup);
			}
		}
	}
}
