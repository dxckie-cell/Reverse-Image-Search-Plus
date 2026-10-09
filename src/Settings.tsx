import { React, ReactNative } from "@vendetta/metro/common";
import { findByProps } from "@vendetta/metro";
import { Forms } from "@vendetta/ui/components";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { ENGINES } from "./engines";

const find = (prop: string): any => findByProps(prop)?.[prop];
const TableRow: any = find("TableRow") ?? Forms.FormRow;
const TableRowGroup: any = find("TableRowGroup") ?? Forms.FormSection;
const TableSwitchRow: any = find("TableSwitchRow") ?? Forms.FormSwitchRow;

const { ScrollView, View, Text } = ReactNative;

export default function Settings() {
    useProxy(storage);

    return (
        <ScrollView style={{ flex: 1 }}>
            <TableRowGroup title="Long-press button">
                <TableSwitchRow
                    label="Show every engine"
                    subLabel="Add one row per search engine instead of only the default one"
                    value={!!storage.showAllEngines}
                    onValueChange={(v: boolean) => (storage.showAllEngines = v)}
                />
            </TableRowGroup>
            <TableRowGroup title="Default engine">
                {ENGINES.map((engine) => (
                    <TableRow
                        key={engine.id}
                        label={engine.name}
                        trailing={storage.engine === engine.id ? <Text style={{ fontSize: 18 }}>✓</Text> : undefined}
                        onPress={() => (storage.engine = engine.id)}
                    />
                ))}
            </TableRowGroup>
            <View style={{ height: 24 }} />
        </ScrollView>
    );
}
