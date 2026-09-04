******************************************************************************
INSTALLATION INSTRUCTIONS   (ILIAS 10)
******************************************************************************

1. Copy this folder to:
   <ILIAS_directory>/public/Customizing/global/plugins/Services/Repository/RepositoryObject/Mindmap

2. Rebuild the Composer classmap from the ILIAS root:
   composer du

3. Register RBAC operations (and update the plugin) via CLI from the ILIAS root:
   php cli/setup.php update --legacy-plugin Mindmap

   This runs the Mindmap Setup Agent, which adds the custom edit_map permission,
   clones existing write grants onto it, registers the copy permission on the
   object type, and clones write grants onto copy.

4. Alternatively / additionally: Administration → Plugins → Update / Activate
   (language refresh if offered). Note: custom RBAC registration is handled by
   the Setup Agent in step 3, not by sql/dbupdate.php.

5. Create new Mindmap repository objects as usual.
