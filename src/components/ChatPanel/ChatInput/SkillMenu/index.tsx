import { Popover } from '@/components/Overlay';
import { useChatService } from '@/domains';
import { buildCapabilityPickerSections } from '@/domains/Chat';
import { parseErrorMessage } from '@/utils/error';
import { Button, ListBox, ListBoxItem, toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { Check, Settings, Sparkles, Wrench } from 'lucide-react';
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useChatInputStore, useChatInputStoreApi } from '../ChatInputStore';
import styles from '../style.module.less';

function SkillMenu() {
  const chatService = useChatService();
  const store = useChatInputStoreApi();
  const {
    capabilityOpen,
    selectedAgent,
    selectedSkills,
    selectedTools,
  } = useChatInputStore(
    useShallow((state) => ({
      capabilityOpen: state.capabilityOpen,
      selectedAgent: state.selectedAgent,
      selectedSkills: state.selectedSkills,
      selectedTools: state.selectedTools,
    }))
  );
  const {
    removeSkill,
    setCapabilityOpen,
    setOtherSkillModalOpen,
    toggleSkill,
    toggleTool,
  } = store.getState();
  const { data } = useRequest(
    () => chatService.getChatInputCapabilityOptions({ agent: selectedAgent }),
    {
      refreshDeps: [selectedAgent.agentId],
      onError: (error) => toast.danger(parseErrorMessage(error)),
    }
  );
  const sections = useMemo(
    () =>
      buildCapabilityPickerSections({
        primarySkills: data?.primarySkills ?? [],
        selectedSkills,
        selectedTools,
        toolOptions: data?.tools ?? [],
        advancedMode: true,
        otherSkillGroups: data?.otherSkillGroups ?? [],
      }),
    [data, selectedSkills, selectedTools]
  );
  const primarySection = sections.find((section) => section.key === 'primary-skills');
  const externalSection = sections.find((section) => section.key === 'external-skills');
  const toolSection = sections.find((section) => section.key === 'tools');
  const selectedSkillIds = selectedSkills.map((skill) => skill.skillId);
  const selectedToolIds = selectedTools.map((tool) => tool.toolId);
  const externalItems =
    externalSection?.items.filter((item) => item.kind === 'external-skill') ?? [];
  const capabilityCount = selectedSkills.length + selectedTools.length;

  function handleToggleSkill(skillId: string): void {
    const skill = data?.primarySkills.find((item) => item.skillId === skillId);
    if (!skill) return;
    toggleSkill(skill, selectedAgent);
  }

  function handleToggleTool(toolId: string): void {
    const tool = data?.tools.find((item) => item.toolId === toolId);
    if (!tool) return;
    toggleTool(tool);
  }

  function handleSelectOther(): void {
    setCapabilityOpen(false);
    setOtherSkillModalOpen(true);
  }

  return (
    <Popover isOpen={capabilityOpen} onOpenChange={setCapabilityOpen}>
      <Popover.Trigger title="配置 Agent">
        <span className={styles.toolButtonWrap}>
          {capabilityCount > 0 ? (
            <span className={styles.capabilityBadge}>{capabilityCount}</span>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            className={styles.toolbarCircleBtn}
            aria-label="配置 Agent"
          >
            <Settings size={17} />
          </Button>
        </span>
      </Popover.Trigger>
      <Popover.Content className={styles.toolbarPopover} placement="top">
        <Popover.Dialog>
          <Popover.DeferredContent
            fallback={
              <div
                className={`${styles.deferredPopoverPanel} ${styles.deferredCapabilityPanel}`}
              />
            }
          >
            {() => (
              <div className={styles.capabilityPanel}>
                {primarySection && primarySection.items.length > 0 ? (
                  <>
                    <div className={styles.popoverTitle}>Skill</div>
                    <ListBox
                      aria-label="选择 Skill"
                      selectionMode="multiple"
                      selectedKeys={selectedSkillIds}
                      className={styles.listBox}
                    >
                      {primarySection.items.map((item) => (
                        <ListBoxItem
                          key={item.key}
                          id={item.key}
                          textValue={item.label}
                          onPress={() => handleToggleSkill(item.key)}
                        >
                          <span className={styles.listItemContent}>
                            <Sparkles size={15} />
                            <span>{item.label}</span>
                            {selectedSkillIds.includes(item.key) ? (
                              <Check size={14} className={styles.checkIcon} />
                            ) : null}
                          </span>
                        </ListBoxItem>
                      ))}
                    </ListBox>
                  </>
                ) : null}

                {externalItems.length > 0 ? (
                  <>
                    <div className={styles.popoverTitle}>其他 Skill</div>
                    <ListBox
                      aria-label="已选择的其他 Skill"
                      selectionMode="multiple"
                      selectedKeys={externalItems.map((item) => item.key)}
                      className={styles.listBox}
                    >
                      {externalItems.map((item) => (
                        <ListBoxItem
                          key={item.key}
                          id={item.key}
                          textValue={item.label}
                          onPress={() => removeSkill(item.key)}
                        >
                          <span className={styles.listItemContent}>
                            <Sparkles size={15} />
                            <span>
                              {item.label}
                              {item.sourceText ? (
                                <span className={styles.capabilitySourceText}>
                                  {item.sourceText}
                                </span>
                              ) : null}
                            </span>
                            <Check size={14} className={styles.checkIcon} />
                          </span>
                        </ListBoxItem>
                      ))}
                    </ListBox>
                  </>
                ) : null}

                <Button
                  variant="ghost"
                  size="sm"
                  className={styles.fullWidthButton}
                  onPress={handleSelectOther}
                >
                  选择其他 Skill...
                </Button>

                {toolSection && toolSection.items.length > 0 ? (
                  <>
                    <div className={styles.popoverTitle}>工具</div>
                    <ListBox
                      aria-label="选择工具"
                      selectionMode="multiple"
                      selectedKeys={selectedToolIds}
                      className={styles.listBox}
                    >
                      {toolSection.items.map((item) => (
                        <ListBoxItem
                          key={item.key}
                          id={item.key}
                          textValue={item.label}
                          onPress={() => handleToggleTool(item.key)}
                        >
                          <span className={styles.listItemContent}>
                            <Wrench size={15} />
                            <span>{item.label}</span>
                            {selectedToolIds.includes(item.key) ? (
                              <Check size={14} className={styles.checkIcon} />
                            ) : null}
                          </span>
                        </ListBoxItem>
                      ))}
                    </ListBox>
                  </>
                ) : null}
              </div>
            )}
          </Popover.DeferredContent>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

export default SkillMenu;
