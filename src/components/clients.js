import React, {useState, useEffect} from 'react';
import {Text, Box} from 'ink';
import {useNavigation} from '../contexts/NavigationContext.js';
import {useData} from '../contexts/DataContext.js';
import {useComponentKeys} from '../hooks/useComponentKeys.js';
import {usePolling} from '../hooks/hooks.js';
import {BORDER_COLOR_DEFAULT, BORDER_COLOR_FOCUSED, CLIENT} from '../consts.js';
import BasicTextInput from './BasicTextInput.js';
import DelayedDisappear from './DelayedDisappear.js';
import HelpBottom from './HelpBottom.js';
import Frame from './Frame.js';
import ScrollBox from './ScrollBox.js';
import EditForm from './EditForm.js';
import clientService from '../services/clientService.js';
import pricingService from '../services/pricingService.js';
import ProgressBar from './ProgressBar.js';
import {formatProgressBarText} from './progressBarLayout.js';

const Client = ({height}) => {
  const {isClientFocused, getBorderTitle, mode} = useNavigation();
  const {selectedClientId, setSelectedClientId, reload, triggerReload} =
    useData();

  const [clients, setClients] = useState([]);
  const [message, setMessage] = useState('');
  const [isCreating, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [monthlyData] = usePolling(
    () =>
      selectedClientId
        ? pricingService.getClientMonthlyTarget(selectedClientId)
        : null,
    [selectedClientId, reload],
  );

  useEffect(() => {
    const loadClients = async () => {
      const clientData = await clientService.selectAll();
      setClients(clientData);
      const selectedExists = clientData.some(c => c.id === selectedClientId);
      if (clientData.length > 0 && !selectedExists)
        setSelectedClientId(clientData[0].id);
      if (clientData.length === 0) setSelectedClientId(null);
    };
    loadClients();
  }, [reload, selectedClientId]);

  const selectedClient = clients.find(c => c.id === selectedClientId) || null;

  const selectNextClient = () => {
    const currentIndex = clients.findIndex(c => c.id === selectedClientId);
    const nextIndex = currentIndex < clients.length - 1 ? currentIndex + 1 : 0;
    if (clients[nextIndex]) setSelectedClientId(clients[nextIndex].id);
  };

  const selectPreviousClient = () => {
    const currentIndex = clients.findIndex(c => c.id === selectedClientId);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : clients.length - 1;
    if (clients[prevIndex]) setSelectedClientId(clients[prevIndex].id);
  };

  const borderColor = isClientFocused
    ? BORDER_COLOR_FOCUSED
    : BORDER_COLOR_DEFAULT;
  const title = getBorderTitle(CLIENT);

  const handleNewClient = () => {
    setIsAdding(true);
    setMessage('');
  };

  const handleEditClient = () => {
    if (selectedClient) {
      setIsEditing(true);
      setMessage('');
    } else {
      setMessage('No client selected to edit');
    }
  };

  const handleDeleteClient = () => {
    if (selectedClient) {
      setIsDeleting(true);
      setMessage('');
    } else {
      setMessage('No client selected to delete');
    }
  };

  const handleCreateSubmit = async clientName => {
    if (clientName.trim()) {
      try {
        await clientService.create(clientName.trim());
        const updatedClients = await clientService.selectAll();
        const newClient = updatedClients.find(
          c => c.name === clientName.trim(),
        );
        if (newClient) setSelectedClientId(newClient.id);
        triggerReload();
        setMessage('Client added successfully');
      } catch (error) {
        console.log(error);
        setMessage('Failed to add client');
      }
    }
    setIsAdding(false);
  };

  const handleCreateCancel = () => {
    setIsAdding(false);
    setMessage('');
  };

  const handleDeleteConfirm = async confirmation => {
    if (
      confirmation.toLowerCase() === 'y' ||
      confirmation.toLowerCase() === 'yes'
    ) {
      try {
        await clientService.delete(selectedClient);
        const updatedClients = await clientService.selectAll();
        if (updatedClients.length > 0) {
          setSelectedClientId(updatedClients[0].id);
        } else {
          setSelectedClientId(null);
        }
        triggerReload();
        setMessage('Client deleted successfully');
      } catch (error) {
        console.error('Delete client error:', error);
        setMessage(`Failed to delete client: ${error.message}`);
      }
    } else {
      setMessage('Delete cancelled');
    }
    setIsDeleting(false);
  };

  const handleDeleteCancel = () => {
    setIsDeleting(false);
    setMessage('Delete cancelled');
  };

  const handleEditSubmit = async values => {
    try {
      await clientService.updateAll(selectedClient.id, {
        name: values.name,
        hourlyRate: values.rate,
        monthlyHours: values.monthlyHours,
        dailyHours: values.dailyHours,
      });
      triggerReload();
      setMessage('Client updated');
    } catch (error) {
      setMessage(`Error: ${error.message || 'Failed to update client'}`);
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setMessage('Edit cancelled');
  };

  const keyMappings = [
    {key: 'c', action: handleNewClient},
    {key: 'e', action: handleEditClient},
    {key: 'd', action: handleDeleteClient},
    {key: 'j', action: selectNextClient},
    {key: 'k', action: selectPreviousClient},
  ];

  useComponentKeys(CLIENT, keyMappings, isClientFocused);

  const isInEditMode = isCreating || isDeleting || isEditing;

  const renderContent = () => {
    if (isCreating) {
      return (
        <Box flexDirection="column">
          <Text>New client name:</Text>
          <BasicTextInput
            onSubmit={handleCreateSubmit}
            onCancel={handleCreateCancel}
          />
        </Box>
      );
    }

    if (isDeleting) {
      return (
        <Box flexDirection="column">
          <Text color="red">Delete "{selectedClient?.name}"? (y/n):</Text>
          <BasicTextInput
            onSubmit={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
          />
        </Box>
      );
    }

    if (isEditing) {
      return (
        <EditForm
          title={`Edit: ${selectedClient?.name}`}
          fields={[
            {
              name: 'name',
              label: 'Name',
              defaultValue: selectedClient?.name || '',
            },
            {
              name: 'rate',
              label: 'Rate (PLN/h)',
              defaultValue: selectedClient?.hourly_rate?.toString() || '',
            },
            {
              name: 'monthlyHours',
              label: 'Monthly hours',
              defaultValue: selectedClient?.monthly_hours?.toString() || '',
            },
            {
              name: 'dailyHours',
              label: 'Daily hours',
              defaultValue: selectedClient?.daily_hours?.toString() || '',
            },
          ]}
          onSubmit={handleEditSubmit}
          onCancel={handleEditCancel}
        />
      );
    }

    if (clients.length > 0) {
      const selectedIndex = clients.findIndex(c => c.id === selectedClientId);

      return (
        <ScrollBox
          height={Math.max(1, height - 5)}
          selectedIndex={selectedIndex}
        >
          {clients.map(client => {
            const isSelected = client.id === selectedClientId;

            if (isSelected && monthlyData) {
              const rate = client.hourly_rate;
              const currency = client.currency || 'PLN';
              const currencyShort =
                currency === 'PLN' ? 'zl' : currency.toLowerCase();
              const rateText = rate ? ` ${rate}${currencyShort}` : '';

              return (
                <Box key={client.id} flexDirection="column">
                  <Text>
                    {'> '}
                    <Text bold>{client.name}</Text>
                    <Text dimColor>{rateText}</Text>
                  </Text>
                  <Text>
                    {'  '}
                    <ProgressBar
                      workedHours={monthlyData.workedHours}
                      targetHours={monthlyData.targetHours}
                      remainingHours={monthlyData.remainingHours}
                      hoursPerWorkDay={monthlyData.hoursPerWorkDay}
                      hoursPerWorkDayRaw={monthlyData.hoursPerWorkDayRaw}
                      overflowHours={monthlyData.overflowHours}
                      text={formatProgressBarText(
                        monthlyData.workedHours,
                        monthlyData.targetHours,
                      )}
                    />
                  </Text>
                </Box>
              );
            }

            return (
              <Text key={client.id}>
                {isSelected ? '> ' : '  '}
                <Text bold={isSelected}>{client.name}</Text>
              </Text>
            );
          })}
        </ScrollBox>
      );
    }

    return <Text dimColor>No clients found</Text>;
  };

  const clientCount = clients.length;

  return (
    <Frame borderColor={borderColor} height={height}>
      <Frame.Header>
        <Text color={borderColor} bold>
          {title}
          {clientCount > 0 && <Text dimColor> - {clientCount}</Text>}
        </Text>
        <DelayedDisappear key={message}>
          <Text color="yellow">{message}</Text>
        </DelayedDisappear>
      </Frame.Header>
      <Frame.Body>{renderContent()}</Frame.Body>
      <Frame.Footer>
        {isClientFocused && mode === 'normal' && !isInEditMode && (
          <HelpBottom>c:new e:edit d:delete j/k:nav</HelpBottom>
        )}
      </Frame.Footer>
    </Frame>
  );
};

export default Client;
